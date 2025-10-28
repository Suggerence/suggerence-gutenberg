import { dispatch, select } from '@wordpress/data';
import { createBlock, cloneBlock, switchToBlockType } from '@wordpress/blocks';

/**
 * Recursively collect all block client IDs from the document
 */
function getAllBlockIds(): string[] {
    try {
        const { getBlocks } = select('core/block-editor') as any;
        const blocks = getBlocks();

        const collectIds = (blocks: any[]): string[] => {
            const ids: string[] = [];
            blocks.forEach((block: any) => {
                if (block.clientId) {
                    ids.push(block.clientId);
                }
                if (block.innerBlocks && block.innerBlocks.length > 0) {
                    ids.push(...collectIds(block.innerBlocks));
                }
            });
            return ids;
        };

        return collectIds(blocks);
    } catch (error) {
        console.error('Error getting block IDs:', error);
        return [];
    }
}

export const addBlockTool: SuggerenceMCPResponseTool = {
    name: 'add_block',
    description: '⚠️ PREREQUISITE: Call get_block_schema FIRST to see correct attribute structure and supported styling. Creates and inserts new blocks with FULL styling support: duotone filters, border radius (circular images with "50%"), spacing, typography, colors, and all block-specific attributes. Schema provides usage examples for complex features. Supports nested layouts (columns with innerBlocks). Use "attributes" for content/functional properties, use "style" for visual properties like duotone, borders, colors. Combined with schema, this tool can create blocks with ANY WordPress styling feature.',
    inputSchema: {
        type: 'object',
        properties: {
            block_type: {
                type: 'string',
                description: 'The WordPress block type identifier to create. Must be a valid registered block type (e.g., "core/paragraph" for text, "core/heading" for titles, "core/image" for images, "core/button" for buttons). Use get available blocks tool to see all valid block types if unsure.'
            },
            attributes: {
                type: 'object',
                description: 'Block-specific configuration and content properties. Each block type has different attributes. Common examples: {"content": "Your text here"} for paragraphs, {"content": "Title", "level": 2} for headings, {"url": "https://...", "alt": "description"} for images. Use get_block_schema to see all available attributes for any block type. This is for content/functional properties, NOT visual styling.',
                additionalProperties: true
            },
            style: {
                type: 'object',
                description: 'WordPress style object for visual styling when creating the block. Supports duotone filters (color.duotone), border radius (border.radius: "50%" for circles), spacing (spacing.padding/margin), typography (typography.fontSize, fontWeight), colors (color.text, color.background). Use get_block_schema to see which style properties are supported for this block type and get usage examples.',
                additionalProperties: true
            },
            inner_blocks: {
                type: 'array',
                description: 'Array of child blocks for container blocks like columns, groups, buttons, etc. Each inner block has same structure: {blockType, attributes, innerBlocks}. COLUMNS EXAMPLE - For 2-column 50/50 layout with image left and text right: [{"block_type": "core/column", "attributes": {"width": "50%"}, "inner_blocks": [{"block_type": "core/image", "attributes": {"id": 123, "url": "...", "alt": "..."}}]}, {"block_type": "core/column", "attributes": {"width": "50%"}, "inner_blocks": [{"block_type": "core/heading", "attributes": {"content": "Title", "level": 2}}, {"block_type": "core/paragraph", "attributes": {"content": "Description"}}]}]. For 3 equal columns use three core/column blocks each with "width": "33.33%".',
                items: {
                    type: 'object',
                    properties: {
                        block_type: {
                            type: 'string',
                            description: 'Block type for this inner block'
                        },
                        attributes: {
                            type: 'object',
                            description: 'Attributes for this inner block',
                            additionalProperties: true
                        },
                        inner_blocks: {
                            type: 'array',
                            description: 'Nested inner blocks (supports unlimited nesting)',
                            items: {
                                type: 'object'
                            }
                        }
                    },
                    required: ['block_type']
                }
            },
            position: {
                type: 'string',
                description: 'Insertion position relative to the target block. "before" inserts above the target block, "after" inserts below it, "end" appends to the bottom of the document. Defaults to "after" if not specified.',
                enum: ['before', 'after', 'end']
            },
            relative_to_block_id: {
                type: 'string',
                description: 'The client ID of the reference block for positioning. If not provided, uses the currently selected block in the editor. Only needed when inserting relative to a specific block that is not currently selected.'
            }
        },
        required: ['block_type']
    }
};

export const moveBlockTool: SuggerenceMCPResponseTool = {
    name: 'move_block',
    description: 'Relocates an existing block to a different position relative to another block. Use this when the user wants to reorder content, move a paragraph up or down, reorganize sections, or move blocks inside groups, columns, or other container blocks. Works with nested blocks and maintains the block\'s content and attributes while changing only its position.',
    inputSchema: {
        type: 'object',
        properties: {
            block_id: {
                type: 'string',
                description: 'The client ID of the block to relocate. If omitted, moves the currently selected block in the editor. Use this parameter when moving a specific block that is not currently selected.'
            },
            relative_to_block_id: {
                type: 'string',
                description: 'The client ID of the reference block for positioning. The block will be moved relative to this target block. Required to specify where to move the block.'
            },
            position: {
                type: 'string',
                description: 'Position relative to the target block. "before" inserts above the target block, "after" inserts below it. This allows precise positioning even within nested structures like columns or groups.',
                enum: ['before', 'after']
            }
        },
        required: ['relative_to_block_id', 'position']
    }
};

export const duplicateBlockTool: SuggerenceMCPResponseTool = {
    name: 'duplicate_block',
    description: 'Creates an exact copy of an existing block, including all its content, attributes, and styling. Use this when the user wants to replicate content, create similar sections, or use an existing block as a template. The duplicated block gets a new unique ID but preserves all other properties from the original.',
    inputSchema: {
        type: 'object',
        properties: {
            block_id: {
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

export function deleteBlockTool(): SuggerenceMCPResponseTool {
    let availableClientIds = getAllBlockIds();

    // Check if we only have one empty paragraph block
    if (availableClientIds.length === 1) {
        try {
            const { getBlock } = select('core/block-editor') as any;
            const block = getBlock(availableClientIds[0]);
            
            // If it's a paragraph block with no content (or only whitespace), hide it
            if (block && 
                block.name === 'core/paragraph' && 
                (!block.attributes?.content || block.attributes.content.trim() === '')) {
                availableClientIds = [];
            }
        } catch (error) {
            console.error('Error checking block content:', error);
        }
    }

    const hasAvailableBlocks = availableClientIds.length > 0;
    const description = hasAvailableBlocks 
        ? 'Permanently removes a block and all its content from the document. Use this when the user wants to remove unwanted content, clear sections, or delete specific blocks. WARNING: This action is destructive and removes the block completely. The deletion can be undone using the undo tool if needed.'
        : 'No blocks are currently available to delete. The document only contains an empty paragraph block which cannot be deleted.';

    return {
        name: 'delete_block',
        description: description,
        dangerous: true, // Requires user confirmation before execution
        inputSchema: {
            type: 'object',
            properties: {
                block_id: {
                    type: 'string',
                    description: hasAvailableBlocks
                        ? `The clientId of the block to remove. Valid values: ${availableClientIds.join(', ')}. MUST be one of these - do not invent new IDs.`
                        : 'No blocks available to delete.',
                    enum: availableClientIds.length > 0 ? availableClientIds : undefined
                }
            },
            required: ['block_id']
        }
    };
}

export const updateBlockTool: SuggerenceMCPResponseTool = {
    name: 'update_block',
    description: '⚠️ PREREQUISITE: Call get_block_schema FIRST to see available attributes and supported style properties. Modifies existing blocks including ALL advanced features: duotone filters (style.color.duotone), border radius for circular images (style.border.radius: "50%"), spacing (style.spacing.padding/margin), typography (style.typography), colors, and all block-specific properties. The schema shows which style properties are supported and provides usage examples. Use "attributes" for content (url, alt, content), use "style" for visual properties. Supports every WordPress styling capability when combined with schema.',
    inputSchema: {
        type: 'object',
        properties: {
            block_id: {
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
                description: 'WordPress theme.json-compatible style object for visual appearance. Supports ALL block styling features including: duotone filters (color.duotone: ["#highlight", "#shadow"]), border radius (border.radius: "50%" for circles), spacing (spacing.padding/margin with {top, right, bottom, left}), typography (typography.fontSize, fontWeight, lineHeight), colors (color.text, color.background). Structure depends on block supports - use get_block_schema to see available properties and examples. Styles are deeply merged, so you can update individual properties without affecting others.',
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
            block_id: {
                type: 'string',
                description: 'The client ID of the block to transform. If omitted, transforms the currently selected block in the editor. Use this parameter when transforming a specific block that is not currently selected.'
            },
            transform_to: {
                type: 'string',
                description: 'The block type to transform to. Must be a valid WordPress block type identifier (e.g., "core/heading", "core/quote", "core/cover"). The transformation will only succeed if the source block type allows transformation to this target type. Use get block schema tool to see possible transformations for a block type.'
            }
        },
        required: ['transform_to']
    }
};

export const wrapBlockTool: SuggerenceMCPResponseTool = {
    name: 'wrap_block',
    description: 'Wraps one or more blocks inside a container block (e.g., Group, Columns, Cover). This is different from transforming - the original block(s) remain unchanged but become children of a new container block. Common use cases: wrapping an image in columns to create a layout, putting multiple blocks in a group to apply a background, or adding blocks to a cover for overlays. For columns, supports intelligent distribution with custom widths (e.g., 33/66, 25/75, 50/50).',
    inputSchema: {
        type: 'object',
        properties: {
            block_id: {
                type: 'string',
                description: 'The client ID of the block to wrap. If omitted, wraps the currently selected block in the editor. To wrap multiple blocks, use blockIds instead.'
            },
            block_ids: {
                type: 'array',
                description: 'Array of block client IDs to wrap together in the container. Use this to wrap multiple blocks at once. If provided, blockId is ignored. For columns, blocks are distributed left-to-right according to columnWidths.',
                items: {
                    type: 'string'
                }
            },
            wrapper_block_type: {
                type: 'string',
                description: 'The container block type to wrap with. Must be a valid WordPress container block like "core/group" (generic container with background/padding), "core/columns" (creates a columns layout), "core/column" (single column), "core/cover" (image/color overlay container), or "core/buttons" (button group container).',
                required: true
            },
            wrapper_attributes: {
                type: 'object',
                description: 'Optional attributes for the wrapper block (e.g., background color, padding). Different containers support different attributes - use get block schema tool on the wrapper type to see available options.',
                additionalProperties: true
            },
            column_widths: {
                type: 'array',
                description: 'For columns wrapper only: Array of width percentages for each column (e.g., ["33.33%", "66.66%"] for 33/66 layout, ["25%", "75%"] for 25/75, or ["50%", "50%"] for 50/50). Must match number of blocks being wrapped. First block goes in first column, second in second column, etc. If omitted, columns are equal width.',
                items: {
                    type: 'string'
                }
            }
        },
        required: ['wrapper_block_type']
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

/**
 * Helper function to recursively create blocks with innerBlocks
 */
function createBlockFromDefinition(blockDef: {
    blockType: string;
    attributes?: Record<string, any>;
    innerBlocks?: any[];
}): any {
    const innerBlocks = blockDef.innerBlocks?.map(innerBlockDef => 
        createBlockFromDefinition(innerBlockDef)
    ).filter(Boolean) || [];

    // Only pass innerBlocks if they exist - some blocks like core/table don't use innerBlocks
    // and passing an empty array can cause issues with their internal processing
    return innerBlocks.length > 0
        ? createBlock(blockDef.blockType, blockDef.attributes || {}, innerBlocks)
        : createBlock(blockDef.blockType, blockDef.attributes || {});
}

export function addBlock(
    blockType: string,
    attributes: Record<string, any> = {},
    position: string = 'after',
    targetBlockId?: string,
    innerBlocks?: any[],
    style?: Record<string, any>
): { content: Array<{ type: string, text: string }> } {
    const { insertBlock } = dispatch('core/block-editor') as any;
    const { getSelectedBlockClientId, getBlockIndex } = select('core/block-editor') as any;
    const { getBlockType: getCoreBlockType } = select('core/blocks') as any;

    // Handle blocks with preset modals (like Kadence blocks)
    const blockTypeDef = getCoreBlockType(blockType);

    // Set showPresets to false for blocks that have this attribute
    if (blockTypeDef?.attributes?.showPresets && attributes.showPresets === undefined) {
        attributes = {
            ...attributes,
            showPresets: false
        };
    }

    // Generate uniqueID for blocks that require it (Kadence blocks)
    // The preset modal is triggered when uniqueID is empty
    if (blockTypeDef?.attributes?.uniqueID && attributes.uniqueID === undefined) {
        attributes = {
            ...attributes,
            uniqueID: '_' + Math.random().toString(36).substring(2, 11)
        };
    }

    // Merge style into attributes if provided (WordPress way)
    if (style && Object.keys(style).length > 0) {
        attributes = {
            ...attributes,
            style: style
        };
    }

    // Create inner blocks recursively if provided
    const processedInnerBlocks = innerBlocks?.map(innerBlockDef =>
        createBlockFromDefinition(innerBlockDef)
    ).filter(Boolean) || [];

    // Special handling for table blocks - ensure body and head are properly structured
    if (blockType === 'core/table') {
        
        // WordPress table structure (based on schema example):
        // body/head: array of row objects
        // Each row object: { cells: [ { content: "text", tag: "td" }, ... ] }
        
        // Convert simple array structure [[cell1, cell2], [cell3, cell4]]
        // to WordPress structure [{ cells: [{ content: "cell1", tag: "td" }, ...] }, ...]
        if (attributes.body && Array.isArray(attributes.body)) {
            attributes.body = attributes.body.map((row: any) => {
                // If row is already properly structured, keep it
                if (row && typeof row === 'object' && 'cells' in row) {
                    return row;
                }
                
                // If row is an array of values, convert to proper structure
                if (Array.isArray(row)) {
                    return {
                        cells: row.map((cell: any) => {
                            // If cell is already an object, ensure it has proper structure
                            if (typeof cell === 'object' && cell !== null) {
                                return {
                                    content: String(cell.content || cell),
                                    tag: cell.tag || 'td'
                                };
                            }
                            // If cell is a simple value, wrap it
                            return {
                                content: String(cell),
                                tag: 'td'
                            };
                        })
                    };
                }
                
                return row;
            });
        }
        
        // Same transformation for head
        if (attributes.head && Array.isArray(attributes.head)) {
            attributes.head = attributes.head.map((row: any) => {
                if (row && typeof row === 'object' && 'cells' in row) {
                    return row;
                }
                
                if (Array.isArray(row)) {
                    return {
                        cells: row.map((cell: any) => {
                            if (typeof cell === 'object' && cell !== null) {
                                return {
                                    content: String(cell.content || cell),
                                    tag: cell.tag || 'th'
                                };
                            }
                            return {
                                content: String(cell),
                                tag: 'th'
                            };
                        })
                    };
                }
                
                return row;
            });
        }
    }

    // Only pass innerBlocks if they exist - some blocks like core/table don't use innerBlocks
    // and passing an empty array can cause issues with their internal processing
    let newBlock: any;
    try {
        newBlock = processedInnerBlocks.length > 0
            ? createBlock(blockType, attributes, processedInnerBlocks)
            : createBlock(blockType, attributes);
    } catch (error) {
        console.error('Error creating block:', error);
        return {
            content: [{
                type: 'text',
                text: JSON.stringify({
                    success: false,
                    action: 'block_creation_failed',
                    error: `Failed to create block: ${error instanceof Error ? error.message : 'Unknown error'}`,
                    blockType: blockType,
                    attributes: attributes
                })
            }]
        };
    }
    
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
                    index: index,
                    inner_blocks_count: processedInnerBlocks.length
                }
            })
        }]
    };
}

export function moveBlock(args: {
    targetBlockId: string;
    position: string;
    blockId?: string;
}): { content: Array<{ type: string, text: string }> } {
    const { moveBlocksToPosition } = dispatch('core/block-editor') as any;
    const { getSelectedBlockClientId, getBlockIndex, getBlock, getBlockRootClientId } = select('core/block-editor') as any;

    const sourceBlockId = args.blockId || getSelectedBlockClientId();

    if (!sourceBlockId) {
        return {
            content: [{
                type: 'text',
                text: JSON.stringify({
                    success: false,
                    action: 'block_move_failed',
                    error: 'No block selected and no blockId provided'
                })
            }]
        };
    }

    // Validate target block exists
    const targetBlock = getBlock(args.targetBlockId);
    if (!targetBlock) {
        return {
            content: [{
                type: 'text',
                text: JSON.stringify({
                    success: false,
                    action: 'block_move_failed',
                    error: `Target block with ID ${args.targetBlockId} not found`
                })
            }]
        };
    }

    // Validate source block exists
    const sourceBlock = getBlock(sourceBlockId);
    if (!sourceBlock) {
        return {
            content: [{
                type: 'text',
                text: JSON.stringify({
                    success: false,
                    action: 'block_move_failed',
                    error: `Source block with ID ${sourceBlockId} not found`
                })
            }]
        };
    }

    // Get the parent (root) of the target block - this is where we'll move the source block to
    const targetRootClientId = getBlockRootClientId(args.targetBlockId);
    const sourceRootClientId = getBlockRootClientId(sourceBlockId);
    
    // Get the index of the target block within its parent
    const targetIndex = getBlockIndex(args.targetBlockId, targetRootClientId);
    const currentIndex = getBlockIndex(sourceBlockId, sourceRootClientId);

    // Calculate the destination index based on position
    let destinationIndex: number;
    if (args.position.toLowerCase() === 'before') {
        destinationIndex = targetIndex;
    } else if (args.position.toLowerCase() === 'after') {
        destinationIndex = targetIndex + 1;
    } else {
        return {
            content: [{
                type: 'text',
                text: JSON.stringify({
                    success: false,
                    action: 'block_move_failed',
                    error: `Invalid position "${args.position}". Must be "before" or "after".`
                })
            }]
        };
    }

    // If moving within the same parent and the source is before the target,
    // we need to adjust the index because removing the source will shift indices
    if (sourceRootClientId === targetRootClientId && currentIndex < destinationIndex) {
        destinationIndex--;
    }

    // Check if block is already at the target position
    if (sourceRootClientId === targetRootClientId && currentIndex === destinationIndex) {
        return {
            content: [{
                type: 'text',
                text: JSON.stringify({
                    success: true,
                    action: 'block_already_at_position',
                    data: {
                        block_id: sourceBlockId,
                        relative_to_block_id: args.targetBlockId,
                        position: args.position
                    }
                })
            }]
        };
    }

    try {
        // Move the block from its current parent to the target parent at the calculated index
        moveBlocksToPosition(
            [sourceBlockId],
            sourceRootClientId,
            targetRootClientId,
            destinationIndex
        );

        return {
            content: [{
                type: 'text',
                text: JSON.stringify({
                    success: true,
                    action: 'block_moved',
                    data: {
                        block_id: sourceBlockId,
                        block_type: sourceBlock.name,
                        relative_to_block_id: args.targetBlockId,
                        position: args.position,
                        from_parent: sourceRootClientId || 'root',
                        to_parent: targetRootClientId || 'root',
                        from_index: currentIndex,
                        to_index: destinationIndex
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
                    action: 'block_move_failed',
                    error: `Error moving block: ${error instanceof Error ? error.message : 'Unknown error'}`,
                    block_id: sourceBlockId,
                    relative_to_block_id: args.targetBlockId
                })
            }]
        };
    }
}

export function duplicateBlock(blockId?: string, position?: number): { content: Array<{ type: string, text: string }> } {
    const { getSelectedBlockClientId, getBlockIndex, getBlock } = select('core/block-editor') as any;
    const { insertBlocks } = dispatch('core/block-editor') as any;

    const targetBlockId = blockId || getSelectedBlockClientId();

    if (!targetBlockId) {
        return {
            content: [{
                type: 'text',
                text: JSON.stringify({
                    success: false,
                    action: 'block_duplicate_failed',
                    error: 'No block selected and no blockId provided'
                })
            }]
        };
    }

    const blockToClone = getBlock(targetBlockId);
    
    if (!blockToClone) {
        return {
            content: [{
                type: 'text',
                text: JSON.stringify({
                    success: false,
                    action: 'block_duplicate_failed',
                    error: `Block with ID ${targetBlockId} not found`
                })
            }]
        };
    }

    try {
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
    } catch (error) {
        return {
            content: [{
                type: 'text',
                text: JSON.stringify({
                    success: false,
                    action: 'block_duplicate_failed',
                    error: `Error duplicating block: ${error instanceof Error ? error.message : 'Unknown error'}`,
                    block_id: targetBlockId,
                    block_type: blockToClone.name || 'unknown'
                })
            }]
        };
    }
}

export function deleteBlock(clientId?: string): { content: Array<{ type: string, text: string }> } {
    const { removeBlocks } = dispatch('core/block-editor') as any;
    const { getSelectedBlockClientId, getBlock } = select('core/block-editor') as any;

    const targetClientId = clientId || getSelectedBlockClientId();

    if (!targetClientId) {
        return {
            content: [{
                type: 'text',
                text: JSON.stringify({
                    success: false,
                    action: 'block_delete_failed',
                    error: 'No block selected and no block_id provided'
                })
            }]
        };
    }

    const block = getBlock(targetClientId);

    if (!block) {
        return {
            content: [{
                type: 'text',
                text: JSON.stringify({
                    success: false,
                    action: 'block_delete_failed',
                    error: `Block with block_id "${targetClientId}" not found. This blockId is invalid or does not exist in the current document.`
                })
            }]
        };
    }

    try {
        // Validate block structure before deletion
        // If block has innerBlocks, ensure they're valid
        if (block.innerBlocks && Array.isArray(block.innerBlocks)) {
            // Filter out any null/undefined entries that might cause issues
            const validInnerBlocks = block.innerBlocks.filter((innerBlock: any) => innerBlock != null);
            if (validInnerBlocks.length !== block.innerBlocks.length) {
                console.warn(`Block ${targetClientId} has ${block.innerBlocks.length - validInnerBlocks.length} invalid inner blocks`);
            }
        }

        removeBlocks([targetClientId]);

        return {
            content: [{
                type: 'text',
                text: JSON.stringify({
                    success: true,
                    action: 'block_deleted',
                    data: {
                        block_id: targetClientId,
                        block_type: block.name || 'unknown',
                        had_inner_blocks: block.innerBlocks?.length > 0
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
                    action: 'block_delete_failed',
                    error: `Error deleting block: ${error instanceof Error ? error.message : 'Unknown error'}`,
                    block_id: targetClientId,
                    block_type: block.name || 'unknown'
                })
            }]
        };
    }
}

function updateBlockContent(blockId: string | undefined, content: string): { content: Array<{ type: string, text: string }> } {
    const { updateBlockAttributes } = dispatch('core/block-editor') as any;
    const { getSelectedBlockClientId, getBlock } = select('core/block-editor') as any;

    const targetBlockId = blockId || getSelectedBlockClientId();

    if (!targetBlockId) {
        return {
            content: [{
                type: 'text',
                text: JSON.stringify({
                    success: false,
                    action: 'block_content_update_failed',
                    error: 'No block selected and no blockId provided'
                })
            }]
        };
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
 * Wrap one or more blocks in a container block
 * This creates a new container and clones the blocks into it to avoid circular references
 */
export function wrapBlock(args: {
    blockId?: string;
    blockIds?: string[];
    wrapperBlockType: string;
    wrapperAttributes?: Record<string, any>;
    columnWidths?: string[];
}): { content: Array<{ type: string, text: string }> } {
    const { getSelectedBlockClientId, getBlock, getBlockIndex, getBlockRootClientId } = select('core/block-editor') as any;
    const { replaceBlocks } = dispatch('core/block-editor') as any;
    const { getBlockType } = select('core/blocks') as any;

    // Determine which blocks to wrap
    let blocksToWrap: any[] = [];
    let blockIdsToWrap: string[] = [];

    if (args.blockIds && args.blockIds.length > 0) {
        // Wrap multiple specified blocks
        blockIdsToWrap = args.blockIds;
        blocksToWrap = args.blockIds.map(id => getBlock(id)).filter(Boolean);
    } else {
        // Wrap single block (specified or selected)
        const targetBlockId = args.blockId || getSelectedBlockClientId();
        if (!targetBlockId) {
            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify({
                        success: false,
                        action: 'wrap_block_failed',
                        error: 'No block selected or specified'
                    })
                }]
            };
        }
        const targetBlock = getBlock(targetBlockId);
        if (!targetBlock) {
            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify({
                        success: false,
                        action: 'wrap_block_failed',
                        error: `Block with ID ${targetBlockId} not found`
                    })
                }]
            };
        }
        blockIdsToWrap = [targetBlockId];
        blocksToWrap = [targetBlock];
    }

    if (blocksToWrap.length === 0) {
        return {
            content: [{
                type: 'text',
                text: JSON.stringify({
                    success: false,
                    action: 'wrap_block_failed',
                    error: 'No valid blocks found to wrap'
                })
            }]
        };
    }

    // Validate wrapper block type exists
    const wrapperBlockTypeDef = getBlockType(args.wrapperBlockType);
    if (!wrapperBlockTypeDef) {
        return {
            content: [{
                type: 'text',
                text: JSON.stringify({
                    success: false,
                    action: 'wrap_block_failed',
                    error: `Wrapper block type "${args.wrapperBlockType}" does not exist. Use get_available_blocks to see valid block types.`
                })
            }]
        };
    }

    // Validate column widths if provided
    if (args.columnWidths && args.wrapperBlockType === 'core/columns') {
        if (args.columnWidths.length !== blocksToWrap.length) {
            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify({
                        success: false,
                        action: 'wrap_block_failed',
                        error: `Column widths count (${args.columnWidths.length}) must match blocks count (${blocksToWrap.length})`
                    })
                }]
            };
        }
    }

    try {
        // Clone the blocks to avoid circular reference issues
        const clonedBlocks = blocksToWrap.map(block => cloneBlock(block));

        let wrapperBlock: any;

        // Special handling for columns - wrap each block in a column with optional widths
        if (args.wrapperBlockType === 'core/columns') {
            const columns = clonedBlocks.map((block, index) => {
                const columnAttributes: Record<string, any> = {};
                
                // Apply width if provided
                if (args.columnWidths && args.columnWidths[index]) {
                    columnAttributes.width = args.columnWidths[index];
                }
                
                return createBlock('core/column', columnAttributes, [block]);
            });
            
            wrapperBlock = createBlock('core/columns', args.wrapperAttributes || {}, columns);
        } else {
            // Standard wrapping for other container types
            wrapperBlock = createBlock(
                args.wrapperBlockType,
                args.wrapperAttributes || {},
                clonedBlocks
            );
        }

        // Replace the original blocks with the wrapper containing cloned blocks
        replaceBlocks(blockIdsToWrap, wrapperBlock);

        const columnInfo = args.wrapperBlockType === 'core/columns' && args.columnWidths 
            ? { column_widths: args.columnWidths }
            : {};

        return {
            content: [{
                type: 'text',
                text: JSON.stringify({
                    success: true,
                    action: 'blocks_wrapped',
                    data: {
                        original_block_ids: blockIdsToWrap,
                        wrapper_block_id: wrapperBlock.clientId,
                        wrapper_type: args.wrapperBlockType,
                        wrapped_blocks_count: clonedBlocks.length,
                        inner_blocks: clonedBlocks.map(b => ({ id: b.clientId, type: b.name })),
                        ...columnInfo
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
                    action: 'wrap_block_failed',
                    error: `Error wrapping blocks: ${error instanceof Error ? error.message : 'Unknown error'}`
                })
            }]
        };
    }
}

/**
 * Helper function to get possible transformations for a block type
 */
function getPossibleTransformations(blockName: string): string[] {
    try {
        const { getBlockType } = select('core/blocks') as any;
        const blockType = getBlockType(blockName);
        
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
                    error: `Cannot transform ${currentBlock.name} to ${args.targetBlockType}. Possible transformations: ${possibleTransforms.join(', ') || 'none'}. Use get block schema tool on "${currentBlock.name}" to see the "transforms.to" array for allowed transformations.`
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
        return {
            content: [{
                type: 'text',
                text: JSON.stringify({
                    success: false,
                    action: 'block_insert_after_failed',
                    error: 'No block selected and no afterBlockId provided'
                })
            }]
        };
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