import { dispatch, select } from '@wordpress/data';
import { createBlock, cloneBlock } from '@wordpress/blocks';

function getAvailableBlockTypes(): string[] {
    try {
        const { getBlockTypes } = select('core/blocks') as any;
        const blockTypes = getBlockTypes();
        return blockTypes
            .filter((block: any) => !block.deprecated && !block.private)
            .map((block: any) => block.name);
    } catch (error) {
        // Fallback to common block types if WordPress data is not available
        return ['core/paragraph', 'core/heading', 'core/image', 'core/list', 'core/code', 'core/button', 'core/group', 'core/columns', 'core/cover', 'core/gallery', 'core/audio', 'core/video', 'core/embed', 'core/spacer', 'core/separator', 'core/quote', 'core/table', 'core/html', 'core/shortcode'];
    }
}

export const addBlockTool: SuggerenceMCPResponseTool = {
    name: 'add_block',
    description: 'Add any type of block to the editor',
    inputSchema: {
        type: 'object',
        properties: {
            blockType: {
                type: 'string',
                description: 'The block type to create.',
                enum: getAvailableBlockTypes()
            },
            attributes: {
                type: 'object',
                description: 'Block attributes (Depends on block type, see get_block_schema tool)',
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
    description: 'Duplicate a block in the editor at a specific position',
    inputSchema: {
        type: 'object',
        properties: {
            blockId: {
                type: 'string',
                description: 'The client ID of the block to duplicate (optional, uses selected block if not provided)'
            },
            position: {
                type: 'number',
                description: 'The target position (0-based index) where to duplicate the block (optional, after selected block if not provided)',
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

export const updateBlockTool: SuggerenceMCPResponseTool = {
    name: 'update_block',
    description: 'Update any block using WordPress core APIs. Supports all block types and any WordPress functionality including attributes, styles, transforms.',
    inputSchema: {
        type: 'object',
        properties: {
            blockId: {
                type: 'string',
                description: 'Block client ID (optional, uses selected block if not provided)'
            },
            attributes: {
                type: 'object',
                description: 'Block attributes to update (any WordPress block attribute)',
                additionalProperties: true
            },
            style: {
                type: 'object',
                description: 'WordPress style object for colors, spacing, borders, typography',
                additionalProperties: true
            },
            transformTo: {
                type: 'string',
                description: 'Transform block to different type (e.g., "core/cover")'
            },
            wrapIn: {
                type: 'string',
                description: 'Wrap block in a container block type'
            }
        }
    }
};

export const undoTool: SuggerenceMCPResponseTool = {
    name: 'undo',
    description: 'Undo the last action in the editor',
    inputSchema: {
        type: 'object',
        properties: {}
    }
};

export const redoTool: SuggerenceMCPResponseTool = {
    name: 'redo',
    description: 'Redo the last undone action in the editor',
    inputSchema: {
        type: 'object',
        properties: {}
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
    const { moveBlocksToPosition } = dispatch('core/block-editor') as any;
    const { getSelectedBlockClientId, getBlockIndex, getBlocks, getBlockRootClientId } = select('core/block-editor') as any;

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

    const rootClientId = getBlockRootClientId(sourceBlockId);
    moveBlocksToPosition([sourceBlockId], rootClientId, rootClientId, targetIndex);

    return {
        content: [{
            type: 'text',
            text: `Moved block from position ${currentIndex} to position ${targetIndex}`
        }]
    };
}

export function duplicateBlock(blockId?: string, position?: number): { content: Array<{ type: string, text: string }> } {
    const { getSelectedBlockClientId, getBlockIndex, getBlock } = select('core/block-editor') as any;
    const { insertBlocks } = dispatch('core/block-editor') as any;

    const targetBlockId = blockId || getSelectedBlockClientId();

    if (!targetBlockId) {
        throw new Error('No block selected and no blockId provided');
    }

    const blockToClone = getBlock(targetBlockId);
    const clonedBlock = cloneBlock(blockToClone);

    let index: number | undefined;
    index = position !== undefined ? position : getBlockIndex(targetBlockId) + 1;

    insertBlocks([clonedBlock], index);

    return {
        content: [{
            type: 'text',
            text: `Duplicated block successfully at position: ${position}`
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

function updateBlockContent(blockId: string | undefined, content: string): { content: Array<{ type: string, text: string }> } {
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

export function updateBlock(args: {
    blockId?: string;
    attributes?: Record<string, any>;
    style?: Record<string, any>;
    transformTo?: string;
    wrapIn?: string;
    content?: string;
}): { content: Array<{ type: string, text: string }> } {
    const { getSelectedBlockClientId, getBlock } = select('core/block-editor') as any;
    const { updateBlockAttributes, replaceBlock } = dispatch('core/block-editor') as any;

    const targetBlockId = args.blockId || getSelectedBlockClientId();

    if (!targetBlockId) {
        return {
            content: [{
                type: 'text',
                text: 'No block selected or specified'
            }]
        };
    }

    const currentBlock = getBlock(targetBlockId);
    if (!currentBlock) {
        return {
            content: [{
                type: 'text',
                text: `Block with ID ${targetBlockId} not found`
            }]
        };
    }

    // Handle simple content update
    if (args.content && !args.attributes && !args.style) {
        return updateBlockContent(targetBlockId, args.content);
    }

    // Handle transformations
    if (args.transformTo) {
        const newBlock = createBlock(args.transformTo, {
            ...currentBlock.attributes,
            ...(args.attributes || {})
        }, currentBlock.innerBlocks);

        replaceBlock(targetBlockId, newBlock);

        return {
            content: [{
                type: 'text',
                text: `Transformed block from ${currentBlock.name} to ${args.transformTo}`
            }]
        };
    }

    if (args.wrapIn) {
        const wrapperBlock = createBlock(args.wrapIn, {}, [currentBlock]);
        replaceBlock(targetBlockId, wrapperBlock);

        return {
            content: [{
                type: 'text',
                text: `Wrapped ${currentBlock.name} in ${args.wrapIn}`
            }]
        };
    }

    // Build attributes object to update
    const updateAttributes: Record<string, any> = {};

    // Add regular attributes (but extract any style that was mistakenly put here)
    if (args.attributes) {
        const { style: attributeStyle, ...otherAttributes } = args.attributes;
        Object.assign(updateAttributes, otherAttributes);

        // If style was mistakenly put in attributes, merge it with the proper style
        if (attributeStyle) {
            console.warn('Style found in attributes - moving to proper style object');
            const currentStyle = currentBlock.attributes.style || {};
            const combinedStyle = deepMergeStyles(currentStyle, attributeStyle);
            updateAttributes.style = args.style ?
                deepMergeStyles(combinedStyle, args.style) :
                combinedStyle;
        }
    }

    // Handle style object (WordPress way) - deep merge to preserve existing styles
    if (args.style && !updateAttributes.style) {
        const currentStyle = currentBlock.attributes.style || {};
        updateAttributes.style = deepMergeStyles(currentStyle, args.style);
    }

    // Apply updates using WordPress API
    updateBlockAttributes(targetBlockId, updateAttributes);

    const changedProps = [
        ...(args.attributes ? Object.keys(args.attributes) : []),
        ...(args.style ? ['style'] : []),
        ...(args.content ? ['content'] : [])
    ];

    return {
        content: [{
            type: 'text',
            text: `Updated ${currentBlock.name} block. Changed: ${changedProps.join(', ')}`
        }]
    };
}

function deepMergeStyles(currentStyle: any, newStyle: any): any {
    const merged = { ...currentStyle };

    Object.keys(newStyle).forEach(key => {
        if (newStyle[key] && typeof newStyle[key] === 'object' && !Array.isArray(newStyle[key])) {
            // Deep merge for nested objects like color, typography, spacing, border
            merged[key] = {
                ...merged[key],
                ...newStyle[key]
            };
        } else {
            // Direct assignment for primitive values and arrays
            merged[key] = newStyle[key];
        }
    });

    return merged;
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

export function undo(): { content: Array<{ type: string, text: string }> } {
    const { undo } = dispatch('core/editor') as any;
    const { hasEditorUndo } = select('core/editor') as any;

    if (!hasEditorUndo()) {
        return {
            content: [{
                type: 'text',
                text: 'No actions to undo'
            }]
        };
    }

    undo();

    return {
        content: [{
            type: 'text',
            text: 'Undone last action successfully'
        }]
    };
}

export function redo(): { content: Array<{ type: string, text: string }> } {
    const { redo } = dispatch('core/editor') as any;
    const { hasEditorRedo } = select('core/editor') as any;

    if (!hasEditorRedo()) {
        return {
            content: [{
                type: 'text',
                text: 'No actions to redo'
            }]
        };
    }

    redo();

    return {
        content: [{
            type: 'text',
            text: 'Redone last action successfully'
        }]
    };
}