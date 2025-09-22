import { dispatch, select } from '@wordpress/data';
import { createBlock } from '@wordpress/blocks';

export const addBlockTool: SuggerenceMCPResponseTool = {
    name: 'add_block',
    description: 'Add any type of block to the editor',
    inputSchema: {
        type: 'object',
        properties: {
            blockType: {
                type: 'string',
                description: 'The block type to create. Common types: core/paragraph, core/heading, core/image, core/list, core/code, core/button, core/group, core/columns, core/cover, core/gallery, core/audio, core/video, core/embed, core/spacer, core/separator, core/quote, core/table, core/html, core/shortcode'
            },
            attributes: {
                type: 'object',
                description: 'Block attributes (optional, depends on block type)',
                additionalProperties: true
            },
            position: {
                type: 'string',
                description: 'Where to insert the block relative to selected block (before, after, or end)',
                enum: ['before', 'after', 'end']
            },
            targetBlockId: {
                type: 'string',
                description: 'ID of block to insert relative to (optional, uses selected block if not provided)'
            }
        },
        required: ['blockType']
    }
};

export const moveBlockTool: SuggerenceMCPResponseTool = {
    name: 'move_block',
    description: 'Move a block to any position in the editor',
    inputSchema: {
        type: 'object',
        properties: {
            position: {
                type: 'number',
                description: 'The target position (0-based index) where to move the block'
            },
            blockId: {
                type: 'string',
                description: 'The client ID of the block to move (optional, uses selected block if not provided)'
            }
        },
        required: ['position']
    }
};

export const duplicateBlockTool: SuggerenceMCPResponseTool = {
    name: 'duplicate_block',
    description: 'Duplicate a block in the editor',
    inputSchema: {
        type: 'object',
        properties: {
            blockId: {
                type: 'string',
                description: 'The client ID of the block to duplicate (optional, uses selected block if not provided)'
            }
        }
    }
};

export const deleteBlockTool: SuggerenceMCPResponseTool = {
    name: 'delete_block',
    description: 'Delete a block from the editor',
    inputSchema: {
        type: 'object',
        properties: {
            blockId: {
                type: 'string',
                description: 'The client ID of the block to delete (optional, uses selected block if not provided)'
            }
        }
    }
};

export const selectBlockTool: SuggerenceMCPResponseTool = {
    name: 'select_block',
    description: 'Select a specific block in the editor by its client ID',
    inputSchema: {
        type: 'object',
        properties: {
            blockId: {
                type: 'string',
                description: 'The client ID of the block to select'
            }
        },
        required: ['blockId']
    }
};

export const updateBlockContentTool: SuggerenceMCPResponseTool = {
    name: 'update_block_content',
    description: 'Update the content of an existing block',
    inputSchema: {
        type: 'object',
        properties: {
            blockId: {
                type: 'string',
                description: 'The client ID of the block to update (optional, uses selected block if not provided)'
            },
            content: {
                type: 'string',
                description: 'The new content for the block'
            }
        },
        required: ['content']
    }
};

export function addBlock(blockType: string, attributes: Record<string, any> = {}, position: string = 'after', targetBlockId?: string): { content: Array<{ type: string, text: string }> } {
    const { insertBlock } = dispatch('core/block-editor') as any;
    const { getSelectedBlockClientId, getBlockIndex } = select('core/block-editor') as any;

    const newBlock = createBlock(blockType, attributes);
    const selectedBlockId = targetBlockId || getSelectedBlockClientId();

    let index: number | undefined;
    if (position.toLowerCase() === 'before' && selectedBlockId) {
        index = getBlockIndex(selectedBlockId);
    } else if (position.toLowerCase() === 'after' && selectedBlockId) {
        index = getBlockIndex(selectedBlockId) + 1;
    } else {
        index = undefined;
    }

    insertBlock(newBlock, index);

    return {
        content: [{
            type: 'text',
            text: `Added ${blockType} block${attributes && Object.keys(attributes).length > 0 ? ` with attributes: ${JSON.stringify(attributes)}` : ''}`
        }]
    };
}

export function moveBlock(position: number, blockId?: string): { content: Array<{ type: string, text: string }> } {
    const { removeBlocks, insertBlocks } = dispatch('core/block-editor') as any;
    const { getSelectedBlockClientId, getBlockIndex, getBlocks, getBlock } = select('core/block-editor') as any;

    const sourceBlockId = blockId || getSelectedBlockClientId();

    if (!sourceBlockId) {
        throw new Error('No block selected and no blockId provided');
    }

    const blocks = getBlocks();
    const currentIndex = getBlockIndex(sourceBlockId);
    const maxIndex = blocks.length - 1;
    const targetIndex = Math.max(0, Math.min(position, maxIndex));

    if (currentIndex === targetIndex) {
        return {
            content: [{
                type: 'text',
                text: `Block is already at position ${targetIndex}`
            }]
        };
    }

    const blockToMove = getBlock(sourceBlockId);
    removeBlocks([sourceBlockId], false);
    const adjustedIndex = currentIndex < targetIndex ? targetIndex : targetIndex;
    insertBlocks([blockToMove], adjustedIndex);

    return {
        content: [{
            type: 'text',
            text: `Moved block from position ${currentIndex} to position ${targetIndex}`
        }]
    };
}

export function duplicateBlock(blockId?: string): { content: Array<{ type: string, text: string }> } {
    const { duplicateBlocks } = dispatch('core/block-editor') as any;
    const { getSelectedBlockClientId } = select('core/block-editor') as any;

    const targetBlockId = blockId || getSelectedBlockClientId();

    if (!targetBlockId) {
        throw new Error('No block selected and no blockId provided');
    }

    duplicateBlocks([targetBlockId]);

    return {
        content: [{
            type: 'text',
            text: 'Duplicated block successfully'
        }]
    };
}

export function deleteBlock(blockId?: string): { content: Array<{ type: string, text: string }> } {
    const { removeBlocks } = dispatch('core/block-editor') as any;
    const { getSelectedBlockClientId } = select('core/block-editor') as any;

    const targetBlockId = blockId || getSelectedBlockClientId();

    if (!targetBlockId) {
        throw new Error('No block selected and no blockId provided');
    }

    removeBlocks([targetBlockId]);

    return {
        content: [{
            type: 'text',
            text: 'Deleted block successfully'
        }]
    };
}

export function selectBlock(blockId: string): { content: Array<{ type: string, text: string }> } {
    const { selectBlock } = dispatch('core/block-editor') as any;

    selectBlock(blockId);

    return {
        content: [{
            type: 'text',
            text: `Selected block ${blockId}`
        }]
    };
}

export function updateBlockContent(blockId: string | undefined, content: string): { content: Array<{ type: string, text: string }> } {
    const { updateBlockAttributes } = dispatch('core/block-editor') as any;
    const { getSelectedBlockClientId } = select('core/block-editor') as any;

    const targetBlockId = blockId || getSelectedBlockClientId();

    if (!targetBlockId) {
        throw new Error('No block selected and no blockId provided');
    }

    updateBlockAttributes(targetBlockId, { content });

    return {
        content: [{
            type: 'text',
            text: `Updated block content: "${content}"`
        }]
    };
}

export function insertBlockAfter(blockType: string, afterBlockId?: string): { content: Array<{ type: string, text: string }> } {
    const { insertBlock } = dispatch('core/block-editor') as any;
    const { getSelectedBlockClientId, getBlockIndex } = select('core/block-editor') as any;

    const targetBlockId = afterBlockId || getSelectedBlockClientId();

    if (!targetBlockId) {
        throw new Error('No block selected and no afterBlockId provided');
    }

    const newBlock = createBlock(blockType);
    const index = getBlockIndex(targetBlockId) + 1;

    insertBlock(newBlock, index);

    return {
        content: [{
            type: 'text',
            text: `Inserted ${blockType} block after selected block`
        }]
    };
}