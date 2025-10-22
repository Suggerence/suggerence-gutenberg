import { select } from '@wordpress/data';
import { useContextStore } from '@/apps/gutenberg-assistant/stores/contextStore';
import { useBaseAIWebSocket } from '@/shared/hooks/useBaseAiWebSocket';

export const useAssistantAI = (): UseAITools => {
    const { selectedContexts } = useContextStore();

    /**
     * Get available block types with basic information
     */
    const getAvailableBlockTypes = () => {
        try {
            const { getBlockTypes } = select('core/blocks') as any;
            const blockTypes = getBlockTypes();

            return blockTypes.map((blockType: any) => ({
                name: blockType.name,
                title: blockType.title,
                description: blockType.description || '',
                category: blockType.category,
                keywords: blockType.keywords || [],
                supports: blockType.supports || {}
            })).filter((block: any) => 
                !block.name.includes('core/missing') && 
                !block.name.includes('core/freeform')
            );
        } catch (error) {
            console.warn('Suggerence: Could not retrieve available block types', error);
            return [];
        }
    };

    /**
     * Get comprehensive site context including Gutenberg blocks information
     */
    const getSiteContext = () => {
        let baseContext = {};

        // Always add current Gutenberg blocks information
        try {
            // Use core/editor for the most up-to-date edited content
            const editorStore = select('core/editor') as any;
            const blockEditorStore = select('core/block-editor') as any;

            // Get methods - use core/block-editor for blocks (it has the latest)
            // but use getCurrentPost from core/editor for edited attributes
            const getBlocks = blockEditorStore?.getBlocks;
            const getBlock = blockEditorStore?.getBlock;
            const getSelectedBlockClientId = blockEditorStore?.getSelectedBlockClientId;
            const getSelectedBlock = blockEditorStore?.getSelectedBlock;
            const getEditedPostAttribute = editorStore?.getEditedPostAttribute;

            // Recursive function to process blocks and their inner blocks
            // IMPORTANT: Fetch fresh block data using getBlock() to get the latest content
            const processBlock = (blockId: string, position: number, parentId?: string): any => {
                // Get the FRESH block data from the store
                const freshBlock = getBlock(blockId);
                if (!freshBlock) return null;

                return {
                    position,
                    id: freshBlock.clientId,
                    name: freshBlock.name,
                    content: freshBlock.attributes?.content || '',
                    attributes: freshBlock.attributes,
                    parentId: parentId || null,
                    innerBlocks: freshBlock.innerBlocks?.map((innerBlock: any, innerIndex: number) =>
                        processBlock(innerBlock.clientId, innerIndex, freshBlock.clientId)
                    ).filter(Boolean) || []
                };
            };

            // Get all blocks with content and nested structure
            const blocks = getBlocks();

            // Process each block by fetching fresh data
            const blocksInfo = blocks
                .map((block: any, index: number) => processBlock(block.clientId, index))
                .filter(Boolean);

            // Get selected block info
            const selectedBlockId = getSelectedBlockClientId();
            const selectedBlock = getSelectedBlock();
            const selectedBlockInfo = selectedBlock ? {
                id: selectedBlockId,
                name: selectedBlock.name,
                content: selectedBlock.attributes?.content || '',
                position: blocks.findIndex((b: any) => b.clientId === selectedBlockId)
            } : null;

            // Get post information
            const postTitle = getEditedPostAttribute?.('title') || '';
            const postContent = getEditedPostAttribute?.('content') || '';

            // Get available block types
            const availableBlockTypes = getAvailableBlockTypes();

            // // Auto-add selected image blocks as visual context
            // let contextsWithAutoImageBlock = [...(selectedContexts || [])];
            
            // // Check if the selected block is an image block
            // if (selectedBlock && (selectedBlock.name === 'core/image' || selectedBlock.name === 'core/cover')) {
            //     const imageUrl = selectedBlock.attributes?.url;
                
            //     // Only add if there's an image URL and it's not already in the contexts
            //     if (imageUrl) {
            //         const imageBlockContextId = `auto-image-block-${selectedBlockId}`;
            //         const alreadyExists = contextsWithAutoImageBlock.some(ctx => 
            //             ctx.id === imageBlockContextId || 
            //             (ctx.type === 'block' && ctx.data?.id === selectedBlockId)
            //         );
                    
            //         if (!alreadyExists) {
            //             contextsWithAutoImageBlock.push({
            //                 id: imageBlockContextId,
            //                 type: 'block',
            //                 label: `Selected ${selectedBlock.name === 'core/cover' ? 'Cover' : 'Image'} Block`,
            //                 data: {
            //                     id: selectedBlockId,
            //                     name: selectedBlock.name,
            //                     attributes: selectedBlock.attributes
            //                 }
            //             });
            //         }
            //     }
            // }

            return {
                ...baseContext,
                gutenberg: {
                    post: {
                        title: postTitle,
                        totalBlocks: blocks.length
                    },
                    blocks: blocksInfo,
                    selectedBlock: selectedBlockInfo,
                    availableBlockTypes: availableBlockTypes,
                    lastUpdated: new Date().toISOString()
                },
                selectedContexts: selectedContexts
            };
        } catch (gutenbergError) {
            console.warn('Suggerence: Could not retrieve Gutenberg context', gutenbergError);
            return {
                ...baseContext,
                gutenberg: {
                    error: 'Could not access Gutenberg data',
                    lastUpdated: new Date().toISOString()
                },
                selectedContexts: selectedContexts || []
            };
        }
    };

    /**
     * Format block information for the prompt
     */
    const formatBlockInfo = (block: any, indent = ''): string => {
        let result = `${indent}${block.position}. ${block.name} (block_id: ${block.id})`;
        
        if (block.content) {
            const truncated = block.content.substring(0, 80);
            result += ` - "${truncated}${block.content.length > 80 ? '...' : ''}"`;
        }
        
        if (block.attributes && Object.keys(block.attributes).length > 0) {
            const attrs = JSON.stringify(block.attributes);
            if (attrs !== '{}') {
                result += ` | Attrs: ${attrs}`;
            }
        }
        
        if (block.innerBlocks && block.innerBlocks.length > 0) {
            result += `\n${block.innerBlocks
                .map((inner: any) => formatBlockInfo(inner, indent + '  '))
                .join('\n')}`;
        }
        
        return result;
    };

    /**
     * Format selected context based on type
     */
    const formatSelectedContext = (context: any): string => {
        let info = `• ${context.type.toUpperCase()}: ${context.label} (ID: ${context.id})`;

        if (!context.data) return info;

        switch (context.type) {
            case 'drawing':
                // Drawing data is base64 encoded, we'll pass it via the message content (not in prompt)
                return `${info}
  🎨 **USER DRAWING PROVIDED** - Analyze the drawing and create the content directly:
  → Use add_block tool for text content (headings, paragraphs, buttons, etc.)
  → Use generate_image tool with input_images parameter for style matching if needed
  → Use insert_pattern tool if the drawing matches a known pattern (hero, CTA, etc.)
  → Build layouts using add_block tool with core/columns for multi-column layouts`;

            case 'image':
                const imageUrl = context.data?.url;
                return `${info}
  🖼️ **IMAGE PROVIDED** - User selected an image
  ${imageUrl ? `→ Image URL: ${imageUrl}` : ''}
  → For "based on this": Use generate_image tool with input_images parameter
  → For editing: Use generate_edited_image tool with image_url: "${imageUrl}"`;

            case 'post':
            case 'page':
                const data = context.data;
                info += `\n  ID: ${data.id}`;
                info += `\n  URL: ${data.link || 'N/A'}`;
                info += `\n  Status: ${data.status || 'N/A'}`;
                if (data.excerpt?.rendered) {
                    const excerpt = data.excerpt.rendered.replace(/<[^>]*>/g, '').trim();
                    info += `\n  Excerpt: "${excerpt.substring(0, 150)}..."`;
                }
                return info;

            case 'block':
                const block = context.data;
                info += `\n  Type: ${block.name}`;
                info += `\n  Block ID: ${block.clientId}`;

                // Special handling for image blocks
                if (block.name === 'core/image' || block.name === 'core/cover') {
                    const blockImageUrl = block.attributes?.url;
                    if (blockImageUrl) {
                        info += `\n  🖼️ **IMAGE BLOCK** - Contains an image`;
                        info += `\n  → Image URL: ${blockImageUrl}`;
                        info += `\n  → For editing: Use generate_edited_image tool with image_url: "${blockImageUrl}"`;
                    }
                }

                if (block.attributes) {
                    info += `\n  Attrs: ${JSON.stringify(block.attributes)}`;
                }
                return info;

            default:
                return info;
        }
    };

    /**
     * Generate the system prompt for the AI assistant
     * @param site_context - Context including gutenberg state, selected contexts, and current reasoning
     */
    const getAssistantSystemPrompt = (site_context: any): string => {
        const { gutenberg, selectedContexts } = site_context;
        
        // Build block types section
        const blockTypesSection = gutenberg?.availableBlockTypes?.length 
            ? `## Available Block Types (${gutenberg.availableBlockTypes.length} total)

Use get_available_blocks tool for complete list or get_block_schema for details.`
            : '';

        // Build current state section
        const currentStateSection = gutenberg 
            ? `## Current Editor State

Post: "${gutenberg.post?.title || 'Untitled'}" | ${gutenberg.post?.totalBlocks || 0} blocks
Selected: ${gutenberg.selectedBlock 
    ? `${gutenberg.selectedBlock.id}` 
    : 'None'}

### Block Structure (use these block_ids for targeting):
${gutenberg.blocks?.map((b: any) => formatBlockInfo(b)).join('\n') || 'No blocks'}`
            : '';

        // Build selected contexts section
        const contextsSection = selectedContexts?.length 
            ? `## User-Selected Context

${selectedContexts.map(formatSelectedContext).join('\n\n')}

⚠️ CRITICAL: If drawing/image context exists above, user has attached visual content!`
            : '';

        // Check if we're in execution phase (have existing reasoning)
        const isExecutionPhase =  true;//!!currentReasoning;

        // Build the mode-specific prompt section
        let modePrompt = '';

//         if (isExecutionPhase) {
//             // EXECUTION MODE - We have an existing plan, execute it
//             const taskList = currentReasoning.plan?.map((task: ReasoningTask) => {
//                 const statusEmoji = task.status === 'completed' ? '✅' :
//                                    task.status === 'in_progress' ? '🔄' :
//                                    task.status === 'failed' ? '❌' : '⏳';
//                 return `Task ${task.order}: ${task.description}`;
//                 // return `${statusEmoji} Task ${task.order}: ${task.description} [${task.status}]`;

//             }).join('\n') || 'No tasks defined';

//             modePrompt = `

// ## EXECUTION MODE - FOLLOW YOUR EXISTING PLAN

// **IMPORTANT: You are in EXECUTION mode. DO NOT create another plan.**

// **Your Analysis:**
// ${currentReasoning.analysis || 'N/A'}

// **Your Tasks:**
// ${taskList}

// **Your Instructions:**
// 1. **DO NOT provide another reasoning/planning response**
// 2. **Execute the next pending task** by calling the appropriate tools
// 3. **Continue executing** until all tasks are completed
// 4. **Provide a final summary** to the user when all tasks are done
//    - If you generated/edited images, include them in your response using markdown: ![alt text](image_url)
//    - Extract image_url from tool results and show the images to the user
// 5. You can call multiple tools in sequence for efficiency

// **Start executing NOW - call the tools needed for the next pending task.**`;
//         } else {
//             // PLANNING MODE - New request, create a plan first
//             modePrompt = `

// ## PLANNING MODE - CREATE A PLAN FIRST

// **IMPORTANT: This is a new user request. You MUST start with a planning response.**

// Your FIRST response MUST be a reasoning response with this exact JSON structure:

// \`\`\`json
// {
//     "type": "reasoning",
//     "reasoning": {
//         "analysis": "Brief understanding of what the user wants and the current context",
//         "plan": [
//             {
//                 "id": "task-1",
//                 "description": "First specific action to take",
//                 "status": "pending",
//                 "order": 1
//             },
//             {
//                 "id": "task-2",
//                 "description": "Second specific action to take",
//                 "status": "pending",
//                 "order": 2
//             }
//         ]
//     }
// }
// \`\`\`

// **Rules for Planning:**
// 1. **BREAK DOWN COMPLEXITY** - Create 3-10 specific, actionable tasks
// 2. **BE SPECIFIC** - Each task should be concrete (e.g., "Call get_block_schema for core/table")
// 3. **SEQUENTIAL THINKING** - Order tasks logically
// 4. **NO EXECUTION YET** - Only plan, don't execute anything`;
//         }

        const commonSections = `

## CORE DIRECTIVES

1. **TOOLS OVER TEXT** - Use tools for actions, not explanations
2. **NO PREFACING** - Skip "I will...", "Let me..." statements
3. **INFER INTENT** - Use context rather than asking questions
4. **PERSIST** - Keep trying alternative approaches if needed
5. **AGENTIC LOOP** - After tool execution, automatically continue:
   a) Call more tools if needed to complete the task
   b) Format results for user ONLY when task is fully complete
   c) Never stop mid-task - finish what user requested

## CANVAS TO BLOCKS WORKFLOW

When user says "Generate the complete page layout from the drawing":

**PRIORITY 1: Use WordPress Patterns**
- Call search_pattern to find pre-built layouts matching the drawing
- Hero/banner sections → search_pattern({search: "hero"}) or search_pattern({category: "banner"}) 
- Call-to-action → search_pattern({category: "call-to-action"})
- Features/services grid → search_pattern({search: "grid"})
- Footer → search_pattern({search: "footer"})
- If pattern matches, call insert_pattern and SKIP building that section manually

**PRIORITY 2: Get Images from Openverse**
- For EVERY image in the drawing, call search_openverse first
- Example: search_openverse({query: "mountain landscape", per_page: 5})
- Pick best result, then upload_openverse_to_media({image_id, image_url, title, creator, license})
- Returns media_id to use in blocks
- ONLY use generate_image if Openverse returns no good results

**PRIORITY 3: Build Layout with Columns**
- Multi-column layouts use add_block with core/columns
- 50/50: inner_blocks: [{block_type: "core/column", attributes: {width: "50%"}, inner_blocks: [...]}, {...}]
- 33/66: widths "33.33%" and "66.66%"
- Put actual content (images, headings, text) inside each column's inner_blocks

**PRIORITY 4: Generate Actual Content**
- READ text annotations in the drawing - they could be instructions for what to create
- Parse compound instructions: "Text about WordPress with Wapuu image" means:
  → Generate paragraph about WordPress history
  → Search Openverse for "Wapuu" (or generate if not found)
  → Create blocks with both text and image
- Examples:
  • "List of 10 names" → Generate real list with 10 actual names
  • "Text about WordPress" → Write actual paragraph about WordPress
  • "3 features" → Create 3 real feature descriptions with titles and descriptions
  • "Benefits section" → Write actual benefits (not "Benefit 1", "Benefit 2")
- Always generate REAL content, NEVER placeholders like "Your text here" or "Lorem ipsum"
- Block syntax:
  • Headings: {block_type: "core/heading", attributes: {content: "Actual Generated Title", level: 2}}
  • Paragraphs: {block_type: "core/paragraph", attributes: {content: "Full generated paragraph..."}}
  • Lists: {block_type: "core/list", attributes: {values: "<li>Real Item 1</li><li>Real Item 2</li>..."}}
  • Buttons: {block_type: "core/button", attributes: {text: "Descriptive CTA", url: "#"}}

**Execute ALL steps** - Don't ask permission, don't stop until complete

### → SINGLE IMAGE REQUESTS
Triggers: "create an image of [subject]", "generate picture"
Action: Call generate_image({prompt: "detailed description", alt_text: "..."})

### → IMAGE EDITING
Triggers: "modify this image", "edit image", "change the background"
Action: Call generate_edited_image({prompt: "changes", image_url: "...", alt_text: "..."})

## BLOCK CREATION GUIDELINES

**🚨 MANDATORY TWO-STEP PROCESS FOR EVERY BLOCK OPERATION:**

YOU MUST ALWAYS FOLLOW THIS EXACT SEQUENCE:

**STEP 1: Call get_block_schema**
- BEFORE any block insertion or update call
- Get the exact attribute structure for that block type
- Example: get_block_schema({block_type: "core/table"})

**STEP 2: Call add_block or update_block**
- AFTER receiving the schema response
- Use the EXACT attribute structure shown in the schema
- Example: add_block({block_type: "core/table", attributes: {body: [{cells: [...]}]}})

**THIS IS NON-NEGOTIABLE. YOU CANNOT SKIP STEP 1.**

**Correct sequence examples:**

User requests a table:
→ First tool call: get_block_schema({block_type: "core/table"})
→ Wait for response with attributes schema
→ Second tool call: add_block with correctly structured attributes

User requests a gallery:
→ First tool call: get_block_schema({block_type: "core/gallery"})
→ Wait for response
→ Second tool call: add_block with images array in correct format

User requests to update a column:
→ First tool call: get_block_schema({block_type: "core/column"})
→ Wait for response
→ Second tool call: update_block with width attribute in correct format

**Why this matters:**
- Every block has different attribute structures
- Wrong attributes = blocks fail to render or corrupt
- Schema shows exact nested object/array structures
- You cannot guess the structure - you must fetch it first

**NEVER call add_block or update_block without calling get_block_schema first in the same conversation turn.**

${blockTypesSection}

${currentStateSection}

${contextsSection}

## EXECUTION RULES

• Chain tool calls - don't wait for permission
• If tool succeeds, immediately call next needed tool
• Only respond to user after ALL work is complete
• Response format: [explanation of what was accomplished in markdown format]

### Image Generation Response Format

After you use generate_image or generate_edited_image tools, the response MUST include the generated image if relevant:

**Example response after image generation:**
I've created the image for you:

![Generated image description](image_url_from_tool_result)

[Optional: Additional explanation about the image]

**Important:**
- Always extract the image_url from the tool result
- Include it as a markdown image in your final response
- Use proper alt text in the image markdown
- The user should be able to see the image directly in the chat

Audio response format:

When you have an audio, you can include it in your response using the following format if relevant:

<audio src="audio_url_from_tool_result" controls></audio>

[Optional: Additional explanation about the audio]`;

        // Construct and return the final prompt
        return `You are a direct-action AI that executes WordPress Gutenberg operations immediately without confirmation.

${commonSections}`;
    };

    const { callAI, parseAIResponse } = useBaseAIWebSocket({
        getSystemPrompt: getAssistantSystemPrompt,
        getSiteContext
    });

    return {
        callAI,
        parseAIResponse
    };
};