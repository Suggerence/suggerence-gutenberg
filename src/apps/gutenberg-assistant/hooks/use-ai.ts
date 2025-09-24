import apiFetch from "@wordpress/api-fetch";
import { select } from '@wordpress/data';
import { useContextStore } from '@/apps/gutenberg-assistant/stores/contextStore';
 
export const useAI = (): UseAITools =>
{
    const { selectedContexts } = useContextStore();

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

    const callAI = async (messages: MCPClientMessage[], model: AIModel | null, tools: SuggerenceMCPResponseTool[]): Promise<MCPClientMessage> =>
    {
        // Get comprehensive site context
        const site_context = getSiteContext();

        const systemPrompt = `You are a Gutenberg Block Editor AI Assistant. Your job is to execute user requests immediately using the available tools.

## CRITICAL BEHAVIOR RULES:
1. **ONE TOOL PER RESPONSE**: Execute exactly ONE tool per response, never claim to do multiple actions at once
2. **ACT IMMEDIATELY**: Execute tools right away without asking for confirmation or permission
3. **NO PLANNING RESPONSES**: Don't explain what you're going to do - just do it
4. **PREFER TOOLS**: Always use tools instead of providing text explanations when possible
5. **TRUTHFUL RESPONSES**: Only report what you actually did with the tool you just executed
6. **LET SYSTEM CONTINUE**: After executing one tool, the system will automatically call you again for the next step
7. **NO QUESTIONS**: Don't ask clarifying questions - use context to infer intent

## DRAWING CONTEXT HANDLING:
When you receive images (user drawings/sketches), they are PROVIDED FOR ANALYSIS to help you understand what the user wants.

**CRITICAL**: If the user says ANYTHING about generating/creating images "based on" their drawing, sketch, or diagram, you MUST:

8. **RECOGNIZE IMAGE GENERATION REQUESTS**: Keywords like "generate image based on my drawing", "create image from sketch", "make an image like my drawing" = IMAGE GENERATION REQUEST
9. **ANALYZE THE DRAWING**: Carefully examine the provided drawing/sketch image that was sent with the message
10. **CREATE DETAILED PROMPT**: Describe what you see in the drawing in detail for image generation
11. **USE add_generated_image TOOL**: Always use add_generated_image tool when user wants images based on their drawings

**EXAMPLES**:
- User: "generate an image based on my drawing" → ANALYZE drawing + USE add_generated_image
- User: "create an image from my sketch" → ANALYZE drawing + USE add_generated_image
- User: "make this drawing into a real image" → ANALYZE drawing + USE add_generated_image

## Block Context Awareness:
- Use the specific block IDs provided below for precise targeting
- Consider block positions and content when making decisions
- Understand parent-child relationships in nested blocks
- Infer positioning based on content structure and user intent

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
            contextInfo += `\n  - **PURPOSE**: If user asks for image generation "based on drawing", analyze what you see`;
            contextInfo += `\n  - **MANDATORY**: Use add_generated_image tool with detailed description of the drawing`;
            contextInfo += `\n  - **KEYWORDS TO WATCH**: "based on drawing", "from sketch", "like my drawing", etc.`;
        } else if (context.type === 'image') {
            // Special handling for uploaded images
            contextInfo += `\n\n  🖼️ **IMAGE ANALYSIS REQUIRED** 🖼️`;
            contextInfo += `\n  - **VISUAL CONTEXT**: This is an image from the user's media library`;
            contextInfo += `\n  - **IMAGE ATTACHED**: The user has selected an actual image that you can see`;
            contextInfo += `\n  - **PURPOSE**: If user asks for image generation "based on image", analyze what you see`;
            contextInfo += `\n  - **MANDATORY**: Use add_generated_image tool with detailed description of the image`;
            contextInfo += `\n  - **KEYWORDS TO WATCH**: "based on image", "like this image", "similar to image", etc.`;
        }
    }

    return contextInfo;
}).join('\n')}

**IMPORTANT**:
- When the user mentions content from these selected contexts, use the specific IDs and data provided above to understand what they're referring to.

**🚨 CRITICAL DRAWING INSTRUCTION 🚨**:
- **IF YOU SEE A DRAWING CONTEXT ABOVE**: The user has attached an actual image/drawing to their message
- **IF USER ASKS TO GENERATE IMAGE FROM/BASED ON THEIR DRAWING**: This is an IMAGE GENERATION REQUEST, NOT a block request
- **MANDATORY ACTION**: Use add_generated_image tool with a detailed prompt describing what you see in their drawing
- **DO NOT**: Ask for clarification or mention blocks when user wants images from drawings
` : ''}

## Response Format:
- **ALWAYS**: Execute exactly one tool per response
- **NEVER**: Claim to have done multiple actions when you only executed one tool
- **REPORT TRUTHFULLY**: Only describe what the single tool you just executed actually accomplished

Example: "Delete the last list item and move the list after the first paragraph"
1. First response: Execute delete tool → "Deleted the last list item"
2. Second response (auto-triggered): Execute move tool → "Moved the list after the first paragraph"
3. Final response: "Task completed"

CRITICAL: Do NOT say "Deleted and moved" when you only executed the delete tool!

Remember: Use the specific block IDs from the context above for precise block targeting.`;
        
        // Convert messages for API call - check if we have visual contexts for the current conversation
        const visualContexts = site_context.selectedContexts?.filter((ctx: any) =>
            ctx.type === 'drawing' || ctx.type === 'image'
        ) || [];

        let convertedMessages;
        if (visualContexts.length > 0) {
            // Find the latest user message to attach images to
            let latestUserMessageIndex = -1;
            for (let i = messages.length - 1; i >= 0; i--) {
                if (messages[i].role === 'user') {
                    latestUserMessageIndex = i;
                    break;
                }
            }

            convertedMessages = messages.map((message, index) => {
                if (index === latestUserMessageIndex) {
                    // Convert the latest user message to include images from all visual contexts

                    const imageAttachments = visualContexts.map((ctx: any) => {
                        console.log('🔍 Processing visual context:', ctx.type, ctx);

                        if (ctx.type === 'drawing') {
                            // Handle drawings (base64 data)
                            return {
                                type: 'image',
                                source: {
                                    type: 'base64',
                                    media_type: 'image/png',
                                    data: ctx.data.split(',')[1] // Remove data:image/png;base64, prefix
                                }
                            };
                        } else if (ctx.type === 'image') {
                            // Handle media library images (URLs)
                            console.log('🔍 Image context data:', ctx.data);
                            console.log('🔍 Image URL:', ctx.data.url);

                            return {
                                type: 'image',
                                source: {
                                    type: 'url',
                                    url: ctx.data.url
                                }
                            };
                        }
                    }).filter(Boolean);

                    if (imageAttachments.length > 0) {
                        return {
                            role: message.role,
                            content: [
                                {
                                    type: 'text',
                                    text: message.content
                                },
                                ...imageAttachments
                            ]
                        };
                    }
                }

                return { role: message.role, content: message.content };
            });
        } else {
            // No drawings, just convert normally
            convertedMessages = messages.map((message) => ({
                role: message.role,
                content: message.content
            }));
        }

        // Debug: Log what we're sending to AI
        console.log('🔍 DEBUG: System prompt contains:', systemPrompt.includes('DRAWING') ? 'DRAWING CONTEXT' : 'NO DRAWING CONTEXT');
        console.log('🔍 DEBUG: Selected contexts:', site_context.selectedContexts?.map(ctx => ctx.type) || 'none');
        console.log('🔍 DEBUG: Visual contexts found:', visualContexts.length);
        console.log('🔍 DEBUG: Converted messages:', convertedMessages.map(m => ({
            role: m.role,
            contentType: typeof m.content,
            isArray: Array.isArray(m.content),
            hasImages: Array.isArray(m.content) ? m.content.some((item: any) => item.type === 'image') : false
        })));

        const requestBody: any = {
            model: model?.id,
            provider: model?.provider,
            system: systemPrompt,
            messages: convertedMessages
        };
        
        // Only add tools if they exist
        if (tools) {
            requestBody.tools = tools;
        }

        // Debug: Log the actual request being sent
        console.log('🔍 DEBUG: Full request body:', {
            model: requestBody.model,
            provider: requestBody.provider,
            systemPromptLength: requestBody.system.length,
            messagesCount: requestBody.messages.length,
            hasTools: !!requestBody.tools,
            toolsCount: requestBody.tools?.length || 0
        });

        // Debug: Log the actual message contents (first 200 chars)
        requestBody.messages.forEach((msg: any, i: number) => {
            console.log(`🔍 DEBUG: Message ${i} (${msg.role}):`,
                Array.isArray(msg.content)
                    ? `Array with ${msg.content.length} items: ${msg.content.map((item: any) => item.type).join(', ')}`
                    : `String: "${msg.content.substring(0, 100)}..."`
            );
        });

        // @ts-ignore
        const response = await apiFetch({
            path: 'suggerence-gutenberg/ai-providers/v1/providers/text',
            headers: {
                'Content-Type': 'application/json',
            },
            method: "POST",
            body: JSON.stringify(requestBody),
        });

        return response as MCPClientMessage;
    }

    const parseAIResponse = (response: any): MCPClientAIResponse =>
    {
        if (response.content) {
            return {
                type: 'text',
                content: response.content
            };
        }

        else if (response.toolName) {
            return {
                type: 'tool',
                toolName: response.toolName,
                toolArgs: response.toolArgs
            };
        }

        return {
            type: 'text',
            content: "No response from AI service"
        };
    }

    return {
        callAI,
        parseAIResponse
    };
}