import { select } from '@wordpress/data';

export const getBlocksInfoTool: SuggerenceMCPResponseTool = {
    name: 'get_blocks_info',
    description: 'Get detailed information about all blocks in the editor with their IDs',
    inputSchema: {
        type: 'object',
        properties: {
            includeContent: {
                type: 'boolean',
                description: 'Whether to include block content in the response (default: false)'
            }
        }
    }
};

export const getSelectedBlockInfoTool: SuggerenceMCPResponseTool = {
    name: 'get_selected_block_info',
    description: 'Get detailed information about the currently selected block',
    inputSchema: {
        type: 'object',
        properties: {}
    }
};

export function getBlocksInfo(includeContent: boolean = false): { content: Array<{ type: string, text: string }> } {
    const { getBlocks } = select('core/block-editor') as any;

    const blocks = getBlocks();
    const blocksInfo = blocks.map((block: any) => ({
        id: block.clientId,
        name: block.name,
        ...(includeContent && {
            content: block.attributes.content || '',
            attributes: block.attributes
        })
    }));

    return {
        content: [{
            type: 'text',
            text: JSON.stringify(blocksInfo, null, 2)
        }]
    };
}

export function getSelectedBlockInfo(): { content: Array<{ type: string, text: string }> } {
    const { getSelectedBlock } = select('core/block-editor') as any;

    const selectedBlock = getSelectedBlock();

    if (!selectedBlock) {
        return {
            content: [{
                type: 'text',
                text: 'No block is currently selected'
            }]
        };
    }

    const blockInfo = {
        id: selectedBlock.clientId,
        name: selectedBlock.name,
        content: selectedBlock.attributes.content || '',
        attributes: selectedBlock.attributes
    };

    return {
        content: [{
            type: 'text',
            text: JSON.stringify(blockInfo, null, 2)
        }]
    };
}