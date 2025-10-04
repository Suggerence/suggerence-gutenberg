import { dispatch, select } from '@wordpress/data';
import { createBlock, cloneBlock, switchToBlockType } from '@wordpress/blocks';

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
    description: 'Creates and inserts a new Gutenberg block into the WordPress editor at a specified position. Use this when the user requests to add content like headings, paragraphs, images, buttons, lists, or any other WordPress block type. This is the primary tool for building page content.',
    inputSchema: {
        type: 'object',
        properties: {
            blockType: {
                type: 'string',
                description: 'The WordPress block type identifier to create. Must be a valid registered block type (e.g., "core/paragraph" for text, "core/heading" for titles, "core/image" for images, "core/button" for buttons). Use get available blocks tool to see all valid block types if unsure.',
                enum: getAvailableBlockTypes()
            },
            attributes: {
                type: 'object',
                description: 'Block-specific configuration and content properties. Each block type has different attributes. Common examples: {"content": "Your text here"} for paragraphs, {"content": "Title", "level": 2} for headings, {"url": "https://...", "alt": "description"} for images. Use get block schema tool to see all available attributes for a specific block type.',
                additionalProperties: true
            },
            position: {
                type: 'string',
                description: 'Insertion position relative to the target block. "before" inserts above the target block, "after" inserts below it, "end" appends to the bottom of the document. Defaults to "after" if not specified.',
                enum: ['before', 'after', 'end']
            },
            targetBlockId: {
                type: 'string',
                description: 'The client ID of the reference block for positioning. If not provided, uses the currently selected block in the editor. Only needed when inserting relative to a specific block that is not currently selected.'
            }
        },
        required: ['blockType']
    }
};

export const moveBlockTool: SuggerenceMCPResponseTool = {
    name: 'move_block',
    description: 'Relocates an existing block to a different position in the document. Use this when the user wants to reorder content, move a paragraph up or down, or reorganize sections. The tool maintains the block\'s content and attributes while changing only its position in the document structure.',
    inputSchema: {
        type: 'object',
        properties: {
            position: {
                type: 'number',
                description: 'The destination index in the document where the block should be moved (0-based, where 0 is the first position). The position is automatically clamped to valid bounds - values beyond the document length will move the block to the end. Example: position 0 moves to top, position 5 moves to the 6th position.'
            },
            blockId: {
                type: 'string',
                description: 'The client ID of the block to relocate. If omitted, moves the currently selected block in the editor. Use this parameter when moving a specific block that is not currently selected.'
            }
        },
        required: ['position']
    }
};

export const duplicateBlockTool: SuggerenceMCPResponseTool = {
    name: 'duplicate_block',
    description: 'Creates an exact copy of an existing block, including all its content, attributes, and styling. Use this when the user wants to replicate content, create similar sections, or use an existing block as a template. The duplicated block gets a new unique ID but preserves all other properties from the original.',
    inputSchema: {
        type: 'object',
        properties: {
            blockId: {
                type: 'string',
                description: 'The client ID of the block to clone. If not provided, duplicates the currently selected block in the editor. This parameter is useful when duplicating a specific block that is not currently selected.'
            },
            position: {
                type: 'number',
                description: 'The 0-based index position where the duplicated block should be inserted. If omitted, the copy is inserted immediately after the original block. Example: position 0 inserts at the top, position 3 inserts as the 4th block.',
            }
        }
    }
};

export const deleteBlockTool: SuggerenceMCPResponseTool = {
    name: 'delete_block',
    description: 'Permanently removes a block and all its content from the document. Use this when the user wants to remove unwanted content, clear sections, or delete specific blocks. WARNING: This action is destructive and removes the block completely. The deletion can be undone using the undo tool if needed.',
    inputSchema: {
        type: 'object',
        properties: {
            blockId: {
                type: 'string',
                description: 'The client ID of the block to remove from the document. If not provided, deletes the currently selected block in the editor. Use this parameter to delete a specific block that is not currently selected.'
            }
        }
    }
};

export const updateBlockTool: SuggerenceMCPResponseTool = {
    name: 'update_block',
    description: 'Modifies an existing block\'s properties, content, and styling. Use this tool to change text content, update attributes, or apply visual styling (colors, spacing, typography, borders). Supports all WordPress block types and styling features. For changing a block to a different type, use the transformation tool instead.',
    inputSchema: {
        type: 'object',
        properties: {
            blockId: {
                type: 'string',
                description: 'The client ID of the block to modify. If omitted, updates the currently selected block in the editor. Use this when updating a specific block that is not selected.'
            },
            attributes: {
                type: 'object',
                description: 'Block-specific attributes to update. These are content and functional properties, NOT visual styles. Examples: {"content": "New text"} for paragraphs, {"level": 3} for heading levels, {"url": "https://..."} for links. Different block types have different attributes - use block schema tool to see available attributes. Visual styling should use the "style" parameter instead.',
                additionalProperties: true
            },
            style: {
                type: 'object',
                description: 'WordPress theme.json-compatible style object for visual appearance. Used for colors, spacing, borders, and typography. Structure: {"color": {"text": "#000000", "background": "#ffffff"}, "spacing": {"padding": {"top": "20px", "left": "10px"}}, "typography": {"fontSize": "18px", "fontWeight": "bold"}, "border": {"radius": "5px", "width": "2px"}}. Styles are deeply merged with existing styles, so you can update individual properties without affecting others.',
                additionalProperties: true
            }
        }
    }
};

export const transformBlockTool: SuggerenceMCPResponseTool = {
    name: 'transform_block',
    description: 'Transforms a block to a different block type while intelligently preserving compatible content and attributes. Use this when the user wants to convert blocks between types (e.g., paragraph to heading, image to cover, quote to paragraph). The tool uses WordPress\'s built-in transformation system which automatically handles attribute mapping and content preservation according to each block\'s registered transform functions. Only allows transformations that are defined as possible by WordPress block registration.',
    inputSchema: {
        type: 'object',
        properties: {
            blockId: {
                type: 'string',
                description: 'The client ID of the block to transform. If omitted, transforms the currently selected block in the editor. Use this parameter when transforming a specific block that is not currently selected.'
            },
            targetBlockType: {
                type: 'string',
                description: 'The block type to transform to. Must be a valid WordPress block type identifier (e.g., "core/heading", "core/quote", "core/cover"). The transformation will only succeed if the source block type allows transformation to this target type. Use get_block_schema to see possible transformations for a block type.',
                required: true
            }
        },
        required: ['targetBlockType']
    }
};

export const undoTool: SuggerenceMCPResponseTool = {
    name: 'undo',
    description: 'Reverts the most recent change made in the editor, restoring the document to its previous state. Use this when the user wants to reverse an action, cancel changes, or step backward through edit history. Works with all editor operations including block additions, deletions, moves, and content updates. This tool has no effect if there are no actions to undo.',
    inputSchema: {
        type: 'object',
        properties: {}
    }
};

export const redoTool: SuggerenceMCPResponseTool = {
    name: 'redo',
    description: 'Reapplies the most recently undone action, moving forward in the edit history. Use this when the user wants to restore a change that was undone, or step forward through the undo history. Only works after an undo operation has been performed. This tool has no effect if there are no actions to redo.',
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
            text: JSON.stringify({
                success: true,
                action: 'block_added',
                data: {
                    block_type: blockType,
                    block_id: newBlock.clientId,
                    attributes: attributes,
                    position: position,
                    index: index
                }
            })
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
                text: JSON.stringify({
                    success: true,
                    action: 'block_already_at_position',
                    data: {
                        block_id: sourceBlockId,
                        position: targetIndex
                    }
                })
            }]
        };
    }

    const rootClientId = getBlockRootClientId(sourceBlockId);
    moveBlocksToPosition([sourceBlockId], rootClientId, rootClientId, targetIndex);

    return {
        content: [{
            type: 'text',
            text: JSON.stringify({
                success: true,
                action: 'block_moved',
                data: {
                    block_id: sourceBlockId,
                    from_position: currentIndex,
                    to_position: targetIndex
                }
            })
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
            text: JSON.stringify({
                success: true,
                action: 'block_duplicated',
                data: {
                    original_block_id: targetBlockId,
                    new_block_id: clonedBlock.clientId,
                    block_type: clonedBlock.name,
                    position: index
                }
            })
        }]
    };
}

export function deleteBlock(blockId?: string): { content: Array<{ type: string, text: string }> } {
    const { removeBlocks } = dispatch('core/block-editor') as any;
    const { getSelectedBlockClientId, getBlock } = select('core/block-editor') as any;

    const targetBlockId = blockId || getSelectedBlockClientId();

    if (!targetBlockId) {
        throw new Error('No block selected and no blockId provided');
    }

    const block = getBlock(targetBlockId);
    removeBlocks([targetBlockId]);

    return {
        content: [{
            type: 'text',
            text: JSON.stringify({
                success: true,
                action: 'block_deleted',
                data: {
                    block_id: targetBlockId,
                    block_type: block?.name || 'unknown'
                }
            })
        }]
    };
}

function updateBlockContent(blockId: string | undefined, content: string): { content: Array<{ type: string, text: string }> } {
    const { updateBlockAttributes } = dispatch('core/block-editor') as any;
    const { getSelectedBlockClientId, getBlock } = select('core/block-editor') as any;

    const targetBlockId = blockId || getSelectedBlockClientId();

    if (!targetBlockId) {
        throw new Error('No block selected and no blockId provided');
    }

    const block = getBlock(targetBlockId);
    updateBlockAttributes(targetBlockId, { content });

    return {
        content: [{
            type: 'text',
            text: JSON.stringify({
                success: true,
                action: 'block_content_updated',
                data: {
                    block_id: targetBlockId,
                    block_type: block?.name || 'unknown',
                    content: content
                }
            })
        }]
    };
}

export function updateBlock(args: {
    blockId?: string;
    attributes?: Record<string, any>;
    style?: Record<string, any>;
    content?: string;
}): { content: Array<{ type: string, text: string }> } {
    const { getSelectedBlockClientId, getBlock } = select('core/block-editor') as any;
    const { updateBlockAttributes } = dispatch('core/block-editor') as any;

    const targetBlockId = args.blockId || getSelectedBlockClientId();

    if (!targetBlockId) {
        return {
            content: [{
                type: 'text',
                text: JSON.stringify({
                    success: false,
                    action: 'block_update_failed',
                    error: 'No block selected or specified'
                })
            }]
        };
    }

    const currentBlock = getBlock(targetBlockId);
    if (!currentBlock) {
        return {
            content: [{
                type: 'text',
                text: JSON.stringify({
                    success: false,
                    action: 'block_update_failed',
                    error: `Block with ID ${targetBlockId} not found`
                })
            }]
        };
    }

    // Handle simple content update
    if (args.content && !args.attributes && !args.style) {
        return updateBlockContent(targetBlockId, args.content);
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
            text: JSON.stringify({
                success: true,
                action: 'block_updated',
                data: {
                    block_id: targetBlockId,
                    block_type: currentBlock.name,
                    updated_properties: changedProps,
                    new_attributes: updateAttributes
                }
            })
        }]
    };
}

/**
 * Helper function to get possible transformations for a block type
 */
function getPossibleTransformations(blockName: string): string[] {
    try {
        const { getBlockType } = select('core/blocks') as any;
        const blockType = getBlockType(blockName);

        console.log('blockType', blockType);
        
        if (!blockType || !blockType.transforms || !blockType.transforms.to) {
            return [];
        }

        // Extract target block names from transform definitions
        const possibleTransforms: string[] = [];
        blockType.transforms.to.forEach((transform: any) => {
            if (transform.type === 'block') {
                // Handle single block transformation
                if (typeof transform.blocks === 'string') {
                    possibleTransforms.push(transform.blocks);
                } else if (Array.isArray(transform.blocks)) {
                    // Handle multiple possible target blocks
                    possibleTransforms.push(...transform.blocks);
                }
            }
        });

        return [...new Set(possibleTransforms)]; // Remove duplicates
    } catch (error) {
        console.error(`Error getting transformations for ${blockName}:`, error);
        return [];
    }
}

/**
 * Transform a block to a different block type with validation
 * Uses WordPress's built-in switchToBlockType which properly executes registered transform functions
 */
export function transformBlock(args: {
    blockId?: string;
    targetBlockType: string;
}): { content: Array<{ type: string, text: string }> } {
    const { getSelectedBlockClientId, getBlock } = select('core/block-editor') as any;
    const { replaceBlocks } = dispatch('core/block-editor') as any;
    const { getBlockType } = select('core/blocks') as any;

    const targetBlockId = args.blockId || getSelectedBlockClientId();

    if (!targetBlockId) {
        return {
            content: [{
                type: 'text',
                text: JSON.stringify({
                    success: false,
                    action: 'block_transform_failed',
                    error: 'No block selected or specified'
                })
            }]
        };
    }

    const currentBlock = getBlock(targetBlockId);
    if (!currentBlock) {
        return {
            content: [{
                type: 'text',
                text: JSON.stringify({
                    success: false,
                    action: 'block_transform_failed',
                    error: `Block with ID ${targetBlockId} not found`
                })
            }]
        };
    }

    // Validate target block type exists
    const targetBlockTypeDef = getBlockType(args.targetBlockType);
    if (!targetBlockTypeDef) {
        return {
            content: [{
                type: 'text',
                text: JSON.stringify({
                    success: false,
                    action: 'block_transform_failed',
                    error: `Target block type "${args.targetBlockType}" does not exist. Use get_available_blocks to see valid block types.`
                })
            }]
        };
    }

    // Get possible transformations for the current block
    const possibleTransforms = getPossibleTransformations(currentBlock.name);
    
    // Check if transformation is allowed
    if (possibleTransforms.length > 0 && !possibleTransforms.includes(args.targetBlockType)) {
        return {
            content: [{
                type: 'text',
                text: JSON.stringify({
                    success: false,
                    action: 'block_transform_failed',
                    error: `Cannot transform ${currentBlock.name} to ${args.targetBlockType}. Possible transformations: ${possibleTransforms.join(', ') || 'none'}. Use get_block_schema on "${currentBlock.name}" to see the "transforms.to" array for allowed transformations.`
                })
            }]
        };
    }

    try {
        // Use WordPress's built-in switchToBlockType which properly handles transformations
        // This respects the transform functions defined in block registration
        const transformedBlocks = switchToBlockType(currentBlock, args.targetBlockType);
        
        if (!transformedBlocks || transformedBlocks.length === 0) {
            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify({
                        success: false,
                        action: 'block_transform_failed',
                        error: `Transformation from ${currentBlock.name} to ${args.targetBlockType} failed. The blocks may not be compatible.`
                    })
                }]
            };
        }

        // Replace the original block with the transformed block(s)
        replaceBlocks(targetBlockId, transformedBlocks);

        const newBlock = transformedBlocks[0];

        return {
            content: [{
                type: 'text',
                text: JSON.stringify({
                    success: true,
                    action: 'block_transformed',
                    data: {
                        original_block_id: targetBlockId,
                        new_block_id: newBlock.clientId,
                        from_type: currentBlock.name,
                        to_type: args.targetBlockType,
                        transformed_blocks_count: transformedBlocks.length,
                        final_attributes: newBlock.attributes,
                        inner_blocks_count: newBlock.innerBlocks?.length || 0
                    }
                })
            }]
        };
    } catch (error) {
        return {
            content: [{
                type: 'text',
                text: JSON.stringify({
                    success: false,
                    action: 'block_transform_failed',
                    error: `Error during transformation: ${error instanceof Error ? error.message : 'Unknown error'}`
                })
            }]
        };
    }
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
                text: JSON.stringify({
                    success: false,
                    action: 'undo_failed',
                    error: 'No actions to undo'
                })
            }]
        };
    }

    undo();

    return {
        content: [{
            type: 'text',
            text: JSON.stringify({
                success: true,
                action: 'undo_completed',
                data: {}
            })
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
                text: JSON.stringify({
                    success: false,
                    action: 'redo_failed',
                    error: 'No actions to redo'
                })
            }]
        };
    }

    redo();

    return {
        content: [{
            type: 'text',
            text: JSON.stringify({
                success: true,
                action: 'redo_completed',
                data: {}
            })
        }]
    };
}