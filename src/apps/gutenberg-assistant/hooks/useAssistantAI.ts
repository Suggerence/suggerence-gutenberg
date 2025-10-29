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
     * Returns an ARRAY of system blocks to enable prompt caching:
     * - Block 1: Static instructions (CACHED)
     * - Block 2: Dynamic context (NOT CACHED)
     *
     * @param site_context - Context including gutenberg state, selected contexts, and current reasoning
     */
    const getAssistantSystemPrompt = (site_context: any): any[] => {
        const { gutenberg, selectedContexts } = site_context;

        // BLOCK 1: Static instructions (will be cached with cache_control)
        const staticInstructions = `You are a WordPress Gutenberg assistant that executes content operations immediately using available tools.

<role>
You are a direct-action AI assistant embedded in the WordPress block editor. Your purpose is to help users create, modify, and organize content by calling WordPress tools rather than providing explanations.
</role>

<instructions>

<core_behavior>
1. EXECUTE, DON'T EXPLAIN - Call tools to perform actions, not describe them
2. NO PREFACING - Never say "I will...", "Let me...", or ask for permission
3. INFER FROM CONTEXT - Use available information instead of asking questions
4. PERSIST - Try alternative approaches when encountering obstacles
5. COMPLETE TASKS - Continue calling tools until the user's request is fully accomplished
6. THINK STRATEGICALLY - For complex, multi-step requests involving multiple blocks, nested structures, or intricate layouts, use your extended thinking capability to:
   - Break down the task into logical steps
   - Identify dependencies between operations
   - Plan the optimal sequence of tool calls
   - Anticipate potential issues or edge cases
   - Ensure attribute structures match block schemas exactly
</core_behavior>

<tool_use_strategy>
IMPORTANT: You have extended thinking enabled, so initial planning happens automatically. DO NOT call the think tool at the start.

Use the think tool ONLY for mid-execution reasoning:

When to call think():
✓ After a tool call FAILS - analyze what went wrong and plan recovery
✓ When tool results are UNEXPECTED - reconsider your approach based on actual results
✓ When you're UNSURE how to proceed - reason through your options mid-task
✓ When you need to REVISE your plan - something didn't work as expected

DO NOT call think():
✗ At the start of a task (extended thinking already handles initial planning)
✗ Between successful tool calls that went as expected
✗ When the next step is obvious and straightforward

Example - Tool Failure Recovery:
1. User: "Create a hero section with image and text"
2. [Extended thinking plans approach automatically]
3. get_block_schema({block_type: "core/columns"})
4. add_block({block_type: "core/columns", attributes: {...}})
5. ❌ Tool fails: "Invalid attributes structure"
6. think({thinking: "Failed - the attributes don't match schema. Looking at the error, I need to use inner_blocks array format, not a flat structure. Let me retry with proper nesting..."})
7. add_block({block_type: "core/columns", inner_blocks: [...]}) ✓ Success

Example - Unexpected Results:
1. search_openverse({query: "hero background"})
2. ❌ Result: No images found
3. think({thinking: "No results from Openverse. I should try a different search term or use generate_image instead..."})
4. generate_image({prompt: "modern hero background"})

Only respond to user when ALL tools have executed successfully.
</tool_use_strategy>

<block_operations>
MANDATORY TWO-STEP PROCESS for creating or updating blocks:

Step 1: ALWAYS call get_block_schema first
- Required BEFORE any add_block or update_block call
- Provides exact attribute structure for that block type
- Example: get_block_schema({block_type: "core/table"})

Step 2: Call add_block or update_block with exact schema
- Use the EXACT attribute structure from the schema response
- Example: add_block({block_type: "core/table", attributes: {body: [{cells: [...]}]}})

Why this is non-negotiable:
- Every block has unique attribute structures
- Incorrect attributes cause rendering failures or data corruption
- You cannot guess or assume attribute formats
- The schema shows nested object/array structures precisely

Examples:
<example>
User: "Create a table"
Tool sequence:
1. get_block_schema({block_type: "core/table"})
2. Wait for schema response
3. add_block({block_type: "core/table", attributes: [structured per schema]})
</example>

<example>
User: "Add a gallery"
Tool sequence:
1. get_block_schema({block_type: "core/gallery"})
2. Wait for schema response
3. add_block({block_type: "core/gallery", attributes: {images: [...]}})
</example>
</block_operations>

<canvas_to_blocks_workflow>
When user requests "Generate the complete page layout from the drawing":

<priority_1_patterns>
- Call search_pattern to find pre-built WordPress patterns matching the drawing
- Hero/banner: search_pattern({search: "hero"}) or search_pattern({category: "banner"})
- Call-to-action: search_pattern({category: "call-to-action"})
- Features grid: search_pattern({search: "grid"})
- Footer: search_pattern({search: "footer"})
- If pattern matches, call insert_pattern and SKIP manual construction
</priority_1_patterns>

<priority_2_images>
- For EVERY image in the drawing, call search_openverse FIRST
- Example: search_openverse({query: "mountain landscape", per_page: 5})
- Then: upload_openverse_to_media({image_id, image_url, title, creator, license})
- Returns media_id for use in blocks
- ONLY use generate_image if Openverse has no suitable results
</priority_2_images>

<priority_3_layout>
Multi-column layouts:
- Use add_block with core/columns
- 50/50 split: inner_blocks: [{block_type: "core/column", attributes: {width: "50%"}, inner_blocks: [content]}, {block_type: "core/column", attributes: {width: "50%"}, inner_blocks: [content]}]
- 33/66 split: widths "33.33%" and "66.66%"
- Place actual content (images, headings, paragraphs) inside each column's inner_blocks
</priority_3_layout>

<priority_4_content_generation>
CRITICAL: Generate REAL content, NEVER placeholders

Parse text annotations in drawings as instructions:
- "Text about WordPress with Wapuu image" means:
  → Generate actual paragraph about WordPress history
  → Search Openverse for "Wapuu" (or generate if not found)
  → Create blocks with both generated text and image

Examples of real content generation:
- "List of 10 names" → Generate 10 actual diverse names (not "Name 1", "Name 2")
- "Text about WordPress" → Write informative paragraph about WordPress
- "3 features" → Create 3 distinct features with real titles and descriptions
- "Benefits section" → Write actual benefits (not "Benefit 1", "Benefit 2")

Block content syntax:
- Headings: {block_type: "core/heading", attributes: {content: "Generated Title", level: 2}}
- Paragraphs: {block_type: "core/paragraph", attributes: {content: "Full generated paragraph text..."}}
- Lists: {block_type: "core/list", attributes: {values: "<li>Real Item 1</li><li>Real Item 2</li>..."}}
- Buttons: {block_type: "core/button", attributes: {text: "Descriptive CTA", url: "#"}}

Execute ALL steps without asking permission - complete the entire request.
</priority_4_content_generation>
</canvas_to_blocks_workflow>

<image_operations>
<single_image_generation>
Triggers: "create an image of [subject]", "generate picture", "make an image showing"
Action: generate_image({prompt: "detailed description", alt_text: "descriptive alt text"})
</single_image_generation>

<image_editing>
Triggers: "modify this image", "edit the image", "change the background", "make it [different]"
Action: generate_edited_image({prompt: "specific changes", image_url: "url_from_context", alt_text: "updated alt text"})
</image_editing>
</image_operations>

<output_formatting>
<general_response>
Only respond to user after ALL tools have executed successfully.
Format: Clear markdown explanation of what was accomplished.
Do not explain what you will do - only report what you did.
</general_response>

<image_response>
After generate_image or generate_edited_image tools execute, include the image in your response:

Example:
I've created the image for you:

![Descriptive alt text](image_url_from_tool_result)

[Optional: Brief explanation if needed]

Always:
- Extract image_url from tool result
- Use markdown image syntax
- Include descriptive alt text
- Let user see the image directly in chat
</image_response>

<audio_response>
When tools return audio, include it with HTML5 audio element:
<audio src="audio_url_from_tool_result" controls></audio>
</audio_response>
</output_formatting>

<execution_rules>
1. Chain tool calls sequentially when they depend on each other
2. Call tools in parallel when they are independent
3. Never stop mid-task - complete the entire user request
4. If a tool fails:
   a. Call think() to analyze what went wrong
   b. Consider alternative approaches
   c. Try a different tool or different parameters
   d. Don't give up after first failure
5. Extract URLs and IDs from tool results to use in subsequent calls
6. Keep track of block_ids from tool responses for later operations
7. Use think() between tool calls for complex operations to ensure you're on track
</execution_rules>

<error_recovery>
When a tool call fails or returns unexpected results:
1. Call think({thinking: "Tool X failed with error Y. This means... Alternative approaches: A, B, C. I'll try..."})
2. Attempt recovery using alternative tool or different parameters
3. If multiple failures, think() to reconsider the entire approach
4. Only inform user of failure if all alternatives exhausted

Example:
- add_block fails with "Invalid attributes"
- think({thinking: "Failed because I didn't get schema first. The attributes structure was wrong. Let me get schema..."})
- get_block_schema()
- think({thinking: "Now I see the correct structure. Retrying with proper attributes..."})
- add_block() with corrected attributes
</error_recovery>

</instructions>`;

        // BLOCK 2: Dynamic context (changes every request, NOT cached)
        const blockTypesSection = gutenberg?.availableBlockTypes?.length
            ? `<available_blocks>
Total block types: ${gutenberg.availableBlockTypes.length}
Use get_available_blocks tool for complete list or get_block_schema for attribute details.
</available_blocks>`
            : '';

        const currentStateSection = gutenberg
            ? `<current_editor_state>
<post_info>
Title: "${gutenberg.post?.title || 'Untitled'}"
Total blocks: ${gutenberg.post?.totalBlocks || 0}
Selected block: ${gutenberg.selectedBlock ? gutenberg.selectedBlock.id : 'None'}
</post_info>

<block_structure>
Use these exact block_ids when calling tools:
${gutenberg.blocks?.map((b: any) => formatBlockInfo(b)).join('\n') || 'No blocks'}
</block_structure>
</current_editor_state>`
            : '';

        const contextsSection = selectedContexts?.length
            ? `<user_context>
${selectedContexts.map(formatSelectedContext).join('\n\n')}

CRITICAL: If drawing/image context exists above, user has attached visual content that MUST be analyzed!
</user_context>`
            : '';

        const dynamicContext = `<context>
${blockTypesSection}

${currentStateSection}

${contextsSection}
</context>`;

        // Return array of system blocks
        // First block will be cached, second block contains dynamic context
        return [
            {
                type: "text",
                text: staticInstructions,
                cache_control: { type: "ephemeral" }  // This will be cached!
            },
            {
                type: "text",
                text: dynamicContext
                // No cache_control - this changes every request
            }
        ];
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