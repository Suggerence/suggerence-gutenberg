import { useAI } from '@/apps/ai-chat/hooks/use-ai';
import { useSelect } from '@wordpress/data';
import { useGutenbergMCP } from '@/apps/gutenberg-toolbar/hooks/use-gutenberg-mcp';

export interface UseGutenbergAITools {
    executeCommand: (command: string) => Promise<boolean>;
    isLoading: boolean;
}

export const useGutenbergAI = (): UseGutenbergAITools => {
    const { callAI } = useAI();
    const { isGutenbergServerReady, getGutenbergTools, callGutenbergTool } = useGutenbergMCP();

    // Get current Gutenberg context
    const {
        selectedBlock,
        selectedBlockClientId,
        blocks,
        postTitle,
        postContent
    } = useSelect((select: any) => {
        const {
            getSelectedBlock,
            getSelectedBlockClientId,
            getBlocks,
        } = select('core/block-editor');

        const {
            getEditedPostAttribute,
        } = select('core/editor');

        return {
            selectedBlock: getSelectedBlock(),
            selectedBlockClientId: getSelectedBlockClientId(),
            blocks: getBlocks(),
            postTitle: getEditedPostAttribute('title'),
            postContent: getEditedPostAttribute('content'),
        };
    }, []);

    const executeCommand = async (command: string): Promise<boolean> => {
        try {
            // Wait for Gutenberg server to be ready
            if (!isGutenbergServerReady) {
                throw new Error('Gutenberg MCP server not ready');
            }

            // Get only Gutenberg-specific tools (separate from main chat MCP tools)
            const gutenbergTools = await getGutenbergTools();

            // Use only Gutenberg tools to avoid conflicts with main chat
            const allTools = gutenbergTools;

            // Debug: Log Gutenberg tools being sent to AI
            console.log('Suggerence Debug: Gutenberg tools being sent to AI:', allTools.length);
            allTools.forEach((tool, index) => {
                console.log(`Suggerence Debug: Tool ${index}:`, tool.name, tool.inputSchema);
            });

            // Create comprehensive post content context for the AI
            const allBlocks = blocks.map((block: any) => ({
                id: block.clientId,
                name: block.name,
                attributes: block.attributes,
                content: block.attributes?.content || '',
                innerBlocks: block.innerBlocks?.map((innerBlock: any) => ({
                    id: innerBlock.clientId,
                    name: innerBlock.name,
                    attributes: innerBlock.attributes,
                    content: innerBlock.attributes?.content || ''
                })) || []
            }));

            // Prepare selected block info for context
            const selectedBlockInfo = selectedBlock ? {
                id: selectedBlockClientId,
                name: selectedBlock.name,
                attributes: selectedBlock.attributes,
                content: selectedBlock.attributes?.content || ''
            } : null;

            // Create message for AI with Gutenberg-specific system prompt
            const messages: MCPClientMessage[] = [
                {
                    role: 'user',
                    content: `Current Post Context:
- Post Title: ${postTitle || 'Untitled'}
- Total Blocks: ${blocks.length}
- Selected Block: ${selectedBlockInfo ? `${selectedBlockInfo.name} (ID: ${selectedBlockInfo.id})` : 'None'}

All Blocks in Post (with IDs for reference):
${allBlocks.map((block: any, index: number) => `${index + 1}. ${block.name} (ID: ${block.id})${block.content ? ` - Content: "${block.content.substring(0, 100)}${block.content.length > 100 ? '...' : ''}"` : ''}${block.innerBlocks.length > 0 ? ` [${block.innerBlocks.length} inner blocks]` : ''}`).join('\n')}

Available Gutenberg Tools:
${gutenbergTools.map(tool => `- ${tool.name}: ${tool.description}`).join('\n')}

User Command: ${command}

Instructions: You have access to all block IDs in the post context above. When the user refers to specific blocks (by content, position, or description), use the block IDs provided to target them precisely. Use the appropriate Gutenberg tools to execute this command, focusing on block manipulation and editor actions.`,
                    date: new Date().toISOString()
                }
            ];

            // Get AI model (we'll use a default one for now)
            const defaultModel: AIModel = {
                id: 'claude-3-haiku-20240307',
                provider: 'anthropic',
                providerName: 'Anthropic',
                name: 'Claude 3 Haiku',
                date: new Date().toISOString(),
                capabilities: ['text']
            };

            // Call AI with tools
            const response = await callAI(messages, defaultModel, allTools);

            // If AI wants to use a tool, execute it
            if (response.toolName && response.toolArgs) {
                let toolResult;

                // All tools are Gutenberg tools now
                toolResult = await callGutenbergTool(response.toolName, response.toolArgs);

                console.log('Tool execution result:', toolResult);
                return true;
            }

            // If AI provides text response, log it
            if (response.content) {
                console.log('AI Response:', response.content);
                return true;
            }

            return false;
        } catch (error) {
            console.error('Error executing Gutenberg command:', error);
            return false;
        }
    };

    return {
        executeCommand,
        isLoading: !isGutenbergServerReady
    };
};