import { select } from '@wordpress/data';
import { useContextStore } from '@/apps/gutenberg-assistant/stores/contextStore';
import { useBaseAI } from '@/shared/hooks/useBaseAi';

export const useAssistantAI = (): UseAITools =>
{
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
            })).filter((block: any) => !block.name.includes('core/missing') && !block.name.includes('core/freeform'));
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
                        // content: postContent,
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

    const getAssistantSystemPrompt = (site_context: any): string => {
        return `You are a Gutenberg Block Editor AI Assistant. Your job is to execute user requests immediately using the available tools.

## CRITICAL BEHAVIOR RULES:
1. **NEVER WRITE TEXT FOR CALLING THE TOOLS**: Never write text for calling the tools, just call the tools directly
2. **ACT IMMEDIATELY**: Execute tools right away without asking for confirmation or permission
3. **NO PLANNING RESPONSES**: Don't explain what you're going to do - just do it
4. **PREFER TOOLS**: Always use tools instead of providing text explanations when possible
5. **TRUTHFUL RESPONSES**: Only report what you actually did with the tool you just executed
7. **NO UNNECESSARY QUESTIONS**: Don't ask clarifying questions unless necessary  - use context to infer intent
8. **NEVER GIVE UP**: If you are asked to do something, do it - don't give up or say you can't do it

## DRAWING CONTEXT HANDLING:
When you receive images (user drawings/sketches), they are PROVIDED FOR ANALYSIS to help you understand what the user wants.

**CRITICAL DECISION TREE**: When user provides drawings/sketches, determine the intent:

8. **CANVAS-TO-BLOCKS REQUESTS** (MOST COMMON for drawings):
   - **STRUCTURE GENERATION**: "create blocks from my drawing", "build page from sketch", "generate layout", "create structure" → USE generate_blocks_from_canvas
   - **LAYOUT CREATION**: "make this layout", "build this page structure", "create content from drawing" → USE generate_blocks_from_canvas
   - **WIREFRAME TO BLOCKS**: User draws webpage layout, UI elements, page structure → USE generate_blocks_from_canvas

9. **IMAGE GENERATION REQUESTS** (Less common for hand-drawn sketches):
   - **NEW IMAGE GENERATION**: "create an image", "generate an image of a dog" → USE generate_image
   - **IMAGE WITH REFERENCE**: "generate image based on my drawing", "create image like this" → USE generate_image_with_inputs
   - **EDIT EXISTING IMAGE**: "modify this image", "make the capybara jump", "change the background", "add wings to this" → USE generate_edited_image

10. **ANALYZE DRAWING CONTENT**: Look for layout elements, text boxes, headers, buttons, columns, content areas
11. **CREATE DETAILED BLOCK STRUCTURE**: When using generate_blocks_from_canvas, provide complete block definitions:
   - **HEADINGS**: Use blockType "core/heading" with attributes like {content: "Title Text", level: 1-6}
   - **PARAGRAPHS**: Use blockType "core/paragraph" with attributes like {content: "Text content"}
   - **BUTTONS**: Use blockType "core/button" with attributes like {text: "Button Text", url: "#"}
   - **COLUMNS**: Use blockType "core/columns" with innerBlocks containing "core/column" blocks
   - **LISTS**: Use blockType "core/list" with attributes like {values: "<li>Item 1</li><li>Item 2</li>"}
   - **IMAGES**: Use blockType "core/image" with attributes like {alt: "Description"}
   - **GROUPS**: Use blockType "core/group" with innerBlocks for containers

12. **CHOOSE CORRECT TOOL**:
   - generate_blocks_from_canvas: Creating WordPress content structure from drawings/sketches/wireframes
   - generate_image: Creating new images from scratch
   - generate_image_with_inputs: Generating new images using other images as reference/style
   - generate_edited_image: Modifying/editing existing images

**EXAMPLES**:
- User: "create blocks from my drawing" → USE generate_blocks_from_canvas
- User: "build this page layout" (with sketch) → USE generate_blocks_from_canvas
- User: "make this wireframe" (with drawing) → USE generate_blocks_from_canvas
- User: "create an image of a dog" → USE generate_image
- User: "generate image based on my drawing" → USE generate_image_with_inputs
- User: "make the capybara jump" (with image) → USE generate_edited_image

## Block Context Awareness:
- Use the specific block IDs provided below for precise targeting
- Consider block positions and content when making decisions
- Understand parent-child relationships in nested blocks
- Infer positioning based on content structure and user intent

## Available Block Types:
${site_context.gutenberg?.availableBlockTypes ? `
You have access to ${site_context.gutenberg.availableBlockTypes.length} block types:

${site_context.gutenberg.availableBlockTypes.map((block: any) =>
    `- **${block.name}**: ${block.title}${block.description ? ` - ${block.description}` : ''}`
).join('\n')}

Use the **get_available_blocks** tool to see all available blocks or **get_block_schema** tool to get detailed information about any specific block type.
` : 'Block types information not available'}

## Current Editor State:
${site_context.gutenberg ? `
- **Post Title**: ${site_context.gutenberg.post?.title || 'Untitled'}
- **Total Blocks**: ${site_context.gutenberg.post?.totalBlocks || 0}
- **Selected Block**: ${site_context.gutenberg.selectedBlock ? `${site_context.gutenberg.selectedBlock.name} at position ${site_context.gutenberg.selectedBlock.position}` : 'None'}

**All Blocks** (use these IDs for precise targeting):
${site_context.gutenberg.blocks?.map((block: any) => {
    const formatBlock = (b: any, indent = '') => {
        let result = `${indent}${b.position}. ${b.name} (ID: ${b.id})`;
        if (b.content) {
            result += ` - "${b.content.substring(0, 80)}${b.content.length > 80 ? '...' : ''}"`;
        }
        if (b.attributes && Object.keys(b.attributes).length > 0) {
            const attrs = JSON.stringify(b.attributes);
            if (attrs !== '{}') {
                result += ` | Attributes: ${attrs}`;
            }
        }
        if (b.innerBlocks && b.innerBlocks.length > 0) {
            result += `\n${b.innerBlocks.map((inner: any) => formatBlock(inner, indent + '  ')).join('\n')}`;
        }
        return result;
    };
    return formatBlock(block);
}).join('\n') || 'No blocks available'}
` : 'Gutenberg context not available'}

${site_context.selectedContexts && site_context.selectedContexts.length > 0 ? `
## Additional Context Selected by User:
${site_context.selectedContexts.map((context: any) => {
    let contextInfo = `- **${context.type.toUpperCase()}**: ${context.label} (ID: ${context.id})`;

    if (context.data) {
        if (context.type === 'post' || context.type === 'page') {
            // Add relevant post/page data
            const data = context.data;
            contextInfo += `\n  - URL: ${data.link || 'N/A'}`;
            contextInfo += `\n  - Status: ${data.status || 'N/A'}`;
            contextInfo += `\n  - Date: ${data.date ? new Date(data.date).toLocaleDateString() : 'N/A'}`;
            if (data.excerpt?.rendered) {
                const excerpt = data.excerpt.rendered.replace(/<[^>]*>/g, '').trim();
                if (excerpt) {
                    contextInfo += `\n  - Excerpt: "${excerpt.substring(0, 150)}${excerpt.length > 150 ? '...' : ''}"`;
                }
            }
        } else if (context.type === 'block') {
            // Add relevant block data
            const block = context.data;
            contextInfo += `\n  - Block Type: ${block.name}`;
            contextInfo += `\n  - Client ID: ${block.clientId}`;
            if (block.attributes && Object.keys(block.attributes).length > 0) {
                contextInfo += `\n  - Attributes: ${JSON.stringify(block.attributes)}`;
            }
        } else if (context.type === 'drawing') {
            // Special handling for drawings - MAKE THIS VERY PROMINENT
            contextInfo += `\n\n  🎨 **DRAWING ANALYSIS REQUIRED** 🎨`;
            contextInfo += `\n  - **VISUAL CONTEXT**: This is a hand-drawn sketch/diagram provided by the user`;
            contextInfo += `\n  - **IMAGE ATTACHED**: The user has provided an actual drawing image that you can see`;
            contextInfo += `\n  - **PRIMARY PURPOSE**: Most likely for page structure/layout generation → USE generate_blocks_from_canvas`;
            contextInfo += `\n  - **SECONDARY PURPOSE**: If specifically for image generation → USE generate_image/generate_image_with_inputs`;
            contextInfo += `\n  - **ANALYZE LAYOUT**: Look for text boxes, headers, buttons, columns, content areas, wireframe elements`;
            contextInfo += `\n  - **KEYWORDS TO WATCH**: "create blocks", "build layout", "make structure", "from drawing", etc.`;
        } else if (context.type === 'image') {
            // Special handling for uploaded images
            contextInfo += `\n\n  🖼️ **IMAGE ANALYSIS REQUIRED** 🖼️`;
            contextInfo += `\n  - **VISUAL CONTEXT**: This is an image from the user's media library`;
            contextInfo += `\n  - **IMAGE ATTACHED**: The user has selected an actual image that you can see`;
            contextInfo += `\n  - **PURPOSE**: If user asks for image generation "based on image", analyze what you see`;
            contextInfo += `\n  - **MANDATORY**: Use generate_image tool with detailed description of the image`;
            contextInfo += `\n  - **KEYWORDS TO WATCH**: "based on image", "like this image", "similar to image", etc.`;
        }
    }

    return contextInfo;
}).join('\n')}

**IMPORTANT**:
- When the user mentions content from these selected contexts, use the specific IDs and data provided above to understand what they're referring to.

**🚨 CRITICAL DRAWING INSTRUCTION 🚨**:
- **IF YOU SEE A DRAWING CONTEXT ABOVE**: The user has attached an actual sketch/drawing to their message
- **DETERMINE INTENT**:
  - **LAYOUT/STRUCTURE REQUEST**: User wants to create page content/blocks → USE generate_blocks_from_canvas
  - **IMAGE GENERATION REQUEST**: User wants to create actual images → USE generate_image/generate_image_with_inputs
- **FOR BLOCK GENERATION**: Analyze the drawing for layout elements (headers, text areas, buttons, columns) and create appropriate block structure
- **DO NOT**: Ask for clarification - analyze the drawing and infer the most likely intent based on content
` : ''}

Remember: Use the specific block IDs from the context above for precise block targeting.`;
    };

    const { callAI, parseAIResponse } = useBaseAI({
        getSystemPrompt: getAssistantSystemPrompt,
        getSiteContext
    });

    return {
        callAI,
        parseAIResponse
    };
}