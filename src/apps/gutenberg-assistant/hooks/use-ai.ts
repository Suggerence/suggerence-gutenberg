import apiFetch from "@wordpress/api-fetch";
import { select } from '@wordpress/data';

export interface UseAITools {
    callAI: (messages: MCPClientMessage[], model: AIModel | null, tools: SuggerenceMCPResponseTool[]) => Promise<MCPClientMessage>;
    parseAIResponse: (response: any) => MCPClientAIResponse;
}

export const useAI = (): UseAITools =>
{
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
                }
            };
        } catch (gutenbergError) {
            console.warn('Suggerence: Could not retrieve Gutenberg context', gutenbergError);
            return {
                ...baseContext,
                gutenberg: {
                    error: 'Could not access Gutenberg data',
                    lastUpdated: new Date().toISOString()
                }
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
        
        const requestBody: any = {
            model: model?.id,
            provider: model?.provider,
            system: systemPrompt,
            messages: messages.map((message) => ({ role: message.role, content: message.content }))
        };
        
        // Only add tools if they exist
        if (tools) {
            requestBody.tools = tools;
        }

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