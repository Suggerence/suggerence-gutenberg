import { useAI } from '@/apps/gutenberg-assistant/hooks/use-ai';
import { useSelect } from '@wordpress/data';
import { BlockSpecificMCPServerFactory } from '@/shared/mcps/servers/BlockSpecificMCPServerFactory';

export const useGutenbergAI = (): UseGutenbergAITools => {
    const { callAI } = useAI();

    // Get current Gutenberg context with block type information
    const {
        selectedBlock,
        selectedBlockClientId,
        blocks,
        postTitle,
        selectedBlockType
    } = useSelect((select: any) => {
        const {
            getSelectedBlock,
            getSelectedBlockClientId,
            getBlocks,
        } = select('core/block-editor');

        const {
            getEditedPostAttribute,
        } = select('core/editor');

        const {
            getBlockType
        } = select('core/blocks');

        const selectedBlock = getSelectedBlock();
        const selectedBlockType = selectedBlock ? getBlockType(selectedBlock.name) : null;

        return {
            selectedBlock,
            selectedBlockClientId: getSelectedBlockClientId(),
            blocks: getBlocks(),
            postTitle: getEditedPostAttribute('title'),
            selectedBlockType
        };
    }, []);

    const executeCommand = async (command: string): Promise<boolean> => {
        try {
            // Check if we have a selected block
            if (!selectedBlock) {
                console.error('No block selected for toolbar action');
                return false;
            }

            // Get block-specific MCP server
            const blockSpecificServer = BlockSpecificMCPServerFactory.getServerForBlock(selectedBlock.name);

            if (!blockSpecificServer) {
                console.error(`No specific tools available for block type: ${selectedBlock.name}`);
                return false;
            }

            // Get block-specific tools
            const blockTools = blockSpecificServer.client.listTools().tools;

            // Debug: Log block-specific tools being sent to AI
            console.log('Block-specific tools being sent to AI:', blockTools.length);
            blockTools.forEach((tool: any, index: number) => {
                console.log(`Block Tool ${index}:`, tool.name, tool.inputSchema);
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

            // Prepare detailed selected block info with type information
            const selectedBlockInfo = selectedBlock ? {
                id: selectedBlockClientId,
                name: selectedBlock.name,
                attributes: selectedBlock.attributes,
                content: selectedBlock.attributes?.content || '',
                typeDefinition: selectedBlockType ? {
                    title: selectedBlockType.title,
                    category: selectedBlockType.category,
                    attributes: selectedBlockType.attributes || {},
                    supports: selectedBlockType.supports || {}
                } : null
            } : null;

            // Generate dynamic context based on selected block
            let selectedBlockContext = '';
            if (selectedBlockInfo) {
                selectedBlockContext = `

Selected Block Details:
- Type: ${selectedBlockInfo.name} (${selectedBlockInfo.typeDefinition?.title || 'Unknown'})
- Category: ${selectedBlockInfo.typeDefinition?.category || 'unknown'}
- ID: ${selectedBlockInfo.id}
- Current Attributes: ${JSON.stringify(selectedBlockInfo.attributes, null, 2)}

Available Attributes for ${selectedBlockInfo.name}:
${selectedBlockInfo.typeDefinition ? Object.entries(selectedBlockInfo.typeDefinition.attributes).map(([attrName, attrDef]: [string, any]) =>
    `- ${attrName}: ${attrDef.type || 'string'}${attrDef.default !== undefined ? ` (default: ${JSON.stringify(attrDef.default)})` : ''}${attrDef.description ? ` - ${attrDef.description}` : ''}`
).join('\n') : 'No attribute schema available'}

Block Capabilities:
${selectedBlockInfo.typeDefinition?.supports ? Object.entries(selectedBlockInfo.typeDefinition.supports).map(([feature, supported]) =>
    `- ${feature}: ${supported}`
).join('\n') : 'No capability information available'}`;
            }

            // Create message for AI with comprehensive block-aware context
            const messages: MCPClientMessage[] = [
                {
                    role: 'user',
                    content: `Current Post Context:
- Post Title: ${postTitle || 'Untitled'}
- Total Blocks: ${blocks.length}
- Selected Block: ${selectedBlockInfo ? `${selectedBlockInfo.name} (ID: ${selectedBlockInfo.id})` : 'None'}${selectedBlockContext}

All Blocks in Post (with IDs for reference):
${allBlocks.map((block: any, index: number) => `${index + 1}. ${block.name} (ID: ${block.id})${block.content ? ` - Content: "${block.content.substring(0, 100)}${block.content.length > 100 ? '...' : ''}"` : ''}${block.innerBlocks.length > 0 ? ` [${block.innerBlocks.length} inner blocks]` : ''}`).join('\n')}

Available Tools for ${selectedBlockInfo?.name}:
${blockTools.map((tool: any) => `- ${tool.name}: ${tool.description}`).join('\n')}

User Command: ${command}

Instructions: You have complete information about the selected ${selectedBlockInfo?.name} block including its available attributes and current values. Use the block-specific tools to modify the current block based on the user's command. Focus only on the selected block - do not add, delete, or manipulate other blocks. These tools are specifically designed for ${selectedBlockInfo?.name} blocks.`,
                    date: new Date().toISOString()
                }
            ];

            // Get AI model (we'll use a default one for now)
            const defaultModel: AIModel = {
                id: 'gemini-2.0-flash',
                provider: 'gemini',
                providerName: 'Gemini',
                name: 'Gemini 2.0 Flash',
                date: new Date().toISOString(),
                capabilities: ['text-generation', 'tool-calling']
            };

            // Call AI with block-specific tools
            const response = await callAI(messages, defaultModel, blockTools);

            // If AI wants to use a tool, execute it on the block-specific server
            if (response.toolName && response.toolArgs) {
                const toolResult = await blockSpecificServer.client.callTool({
                    name: response.toolName,
                    arguments: response.toolArgs
                });

                console.log('Block-specific tool execution result:', toolResult);
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
        isLoading: false // We don't need to wait for the general Gutenberg server
    };
};