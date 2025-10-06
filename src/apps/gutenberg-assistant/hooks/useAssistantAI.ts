import { select } from '@wordpress/data';
import { useContextStore } from '@/apps/gutenberg-assistant/stores/contextStore';
import { useBaseAI } from '@/shared/hooks/useBaseAi';

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
            const {
                getBlocks,
                getSelectedBlockClientId,
                getSelectedBlock,
                getEditedPostAttribute,
            } = select('core/block-editor') as any;

            const {
                getEditedPostAttribute: getEditorPostAttribute,
            } = select('core/editor') as any;

            // Recursive function to process blocks and their inner blocks
            const processBlock = (block: any, position: number, parentId?: string): any => ({
                position,
                id: block.clientId,
                name: block.name,
                content: block.attributes?.content || '',
                attributes: block.attributes,
                parentId: parentId || null,
                innerBlocks: block.innerBlocks?.map((innerBlock: any, innerIndex: number) =>
                    processBlock(innerBlock, innerIndex, block.clientId)
                ) || []
            });

            // Get all blocks with content and nested structure
            const blocks = getBlocks();
            const blocksInfo = blocks.map((block: any, index: number) => processBlock(block, index));

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
            const postTitle = getEditorPostAttribute?.('title') || getEditedPostAttribute?.('title') || '';
            const postContent = getEditorPostAttribute?.('content') || '';

            // Get available block types
            const availableBlockTypes = getAvailableBlockTypes();

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
                selectedContexts: selectedContexts || []
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
        let result = `${indent}${block.position}. ${block.name} (ID: ${block.id})`;
        
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
                return `${info}
  🎨 **USER DRAWING PROVIDED** - Analyze the drawing and create the content directly:
  → Use add block tool for text content (headings, paragraphs, buttons, etc.)
  → Use generate image tool for any images shown in the drawing
  → Use insert pattern tool if the drawing matches a known pattern (hero, CTA, etc.)
  → Build layouts using add block tool with core/columns for multi-column layouts`;

            case 'image':
                return `${info}
  🖼️ **IMAGE PROVIDED** - User selected an image
  → For "based on this": Use generate image tool with description
  → For editing: Use generate edited image tool`;

            case 'post':
            case 'page':
                const data = context.data;
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
                info += `\n  ClientID: ${block.clientId}`;
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
     */
    const getAssistantSystemPrompt = (site_context: any): string => {
        const { gutenberg, selectedContexts } = site_context;
        
        // Build block types section
        const blockTypesSection = gutenberg?.availableBlockTypes?.length 
            ? `## Available Block Types (${gutenberg.availableBlockTypes.length} total)

Common blocks you should know:
${gutenberg.availableBlockTypes.slice(0, 30).map((b: any) => 
    `• ${b.name}: ${b.title}`
).join('\n')}

Use get_available_blocks tool for complete list or get_block_schema for details.`
            : '';

        // Build current state section
        const currentStateSection = gutenberg 
            ? `## Current Editor State

Post: "${gutenberg.post?.title || 'Untitled'}" | ${gutenberg.post?.totalBlocks || 0} blocks
Selected: ${gutenberg.selectedBlock 
    ? `${gutenberg.selectedBlock.name} (pos ${gutenberg.selectedBlock.position})` 
    : 'None'}

### Block Structure (use these IDs for targeting):
${gutenberg.blocks?.map((b: any) => formatBlockInfo(b)).join('\n') || 'No blocks'}`
            : '';

        // Build selected contexts section
        const contextsSection = selectedContexts?.length 
            ? `## User-Selected Context

${selectedContexts.map(formatSelectedContext).join('\n\n')}

⚠️ CRITICAL: If drawing/image context exists above, user has attached visual content!`
            : '';

        return `# Gutenberg Block Editor AI Assistant

You are a direct-action AI that executes WordPress Gutenberg operations immediately without confirmation.

## CORE DIRECTIVES

1. **EXECUTE IMMEDIATELY** - Call tools directly, no permission needed
2. **TOOLS OVER TEXT** - Use tools for actions, not explanations  
3. **NO PREFACING** - Skip "I will...", "Let me..." statements
4. **INFER INTENT** - Use context rather than asking questions
5. **PERSIST** - Keep trying alternative approaches if needed
6. **AGENTIC LOOP** - After tool execution, automatically continue with:
   a) Call more tools if needed to complete the task
   b) Format results for user ONLY when task is fully complete
   c) Never stop mid-task - finish what user requested

## VISUAL INPUT DECISION TREE

When user provides drawings/images, determine intent:

### → BLOCK GENERATION FROM DRAWINGS
Triggers: "create blocks from", "build layout", "make this page", wireframe sketches
Workflow: Directly create blocks by analyzing the drawing:
  1. Identify all elements: headings, text, images, buttons, layout structure
  2. Generate any images first using generate image tool or search in media or openverse
  3. Create blocks using add block tool in the correct order
  4. For layouts, use core/columns or insert pattern tool if it matches a known pattern
Output: WordPress blocks matching the drawing layout

### → IMAGE CREATION (generate_image)  
Triggers: "create an image", "generate picture of [subject]"
Output: New AI-generated image

### → IMAGE EDITING (generate_edited_image)
Triggers: "modify", "change", "edit this image", "add [element] to image"
Output: Modified version of provided image

## BLOCK CREATION GUIDELINES

**CRITICAL: Use The get block schema tool BEFORE creating unfamiliar or complex blocks (tables, galleries, embeds, etc.)**

When creating blocks:

**Common Blocks (schema known):**
• core/heading - Titles (level: 1-6, content: "text")
• core/paragraph - Body text (content: "text")  
• core/button - CTAs (text: "label", url: "#")
• core/columns + core/column - Multi-column layouts
• core/list - Bullet points (values: "<li>item</li>")
• core/image - Pictures (id: number, url: "...", alt: "description")
• core/group - Container sections (with innerBlocks)

**Complex Blocks (MUST check schema first):**
• core/table - Call schema tool to see correct structure
• core/gallery - Call schema tool to see image array format
• core/embed - Call schema tool to see provider options
• Any block you're uncertain about

**Workflow for Complex Blocks:**
1. Call schema tool with the block type
2. Review the attributes schema in response
3. Format your attributes to match the schema
4. Call block creation tool with properly structured attributes

**Required Attributes:**
- Always include content/text for text blocks
- Use descriptive alt text for images
- Set appropriate heading levels (h1-h6)
- Include innerBlocks for container types

${blockTypesSection}

${currentStateSection}

${contextsSection}

## FEATURED IMAGE WORKFLOW

When generating or adding images that should represent the post:
• After generate_image succeeds, consider setting it as featured image with set_featured_image
• Use the image_id (attachment_id) from generate_image response
• Featured images appear in post listings, social shares, and themes
• Example: "Generate hero image" → generate image tool → set featured image tool with returned ID

## OPENVERSE WORKFLOW

For free stock images from Openverse:
• search openverse tool returns image results with all metadata (url, creator, license, etc.)
• insert openverse image tool downloads, uploads to WP, and inserts as image block
• Attribution is automatically added to image caption
• Example: search openverse tool → get result → insert openverse image tool with all result fields

## TOOL EXECUTION WORKFLOW

When you receive tool results:
1. **Evaluate**: Did the tool succeed? Is the task complete?
2. **Continue**: If more tools needed, call them immediately
3. **Respond**: Only provide user-facing response when task is FULLY complete

Example - User says "Add a heading and paragraph":
1. Call add_block for heading → receive result
2. Immediately call add_block for paragraph → receive result  
3. Now respond: "✓ Added heading and paragraph"

Example - User says "Create a featured image of a sunset":
1. Call generate image tool with prompt: "sunset..." → receive result with image_id
2. Call set featured image tool with mediaId: image_id → receive result
3. Now respond: "✓ Generated and set featured image"

## RESPONSE FORMAT

When providing final user response (not during tool execution):
✓ [what was accomplished]
⚠️ [partial completion with explanation]
✗ [error with alternative attempted]

## REMEMBER

• Use exact block IDs from context
• Chain tool calls - don't wait for permission
• Complete multi-step tasks in one flow
• Only format final response after ALL tools execute
• Drawing context = visual input provided
• Tool results are for your processing, not direct user consumption`;
    };

    const { callAI, parseAIResponse } = useBaseAI({
        getSystemPrompt: getAssistantSystemPrompt,
        getSiteContext
    });

    return {
        callAI,
        parseAIResponse
    };
};