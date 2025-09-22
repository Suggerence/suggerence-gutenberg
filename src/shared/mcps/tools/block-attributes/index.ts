import { select, dispatch } from '@wordpress/data';

export const setBlockAttributeTool: SuggerenceMCPResponseTool = {
    name: 'set_block_attribute',
    description: 'Set any attribute value for a block (works with all block types)',
    inputSchema: {
        type: 'object',
        properties: {
            blockId: {
                type: 'string',
                description: 'Block client ID (optional, uses selected block if not provided)'
            },
            attributeName: {
                type: 'string',
                description: 'Name of the attribute to modify (e.g., textColor, backgroundColor, fontSize, alt, url, width, height)'
            },
            attributeValue: {
                description: 'New value for the attribute (type depends on attribute)',
                oneOf: [
                    { type: 'string' },
                    { type: 'number' },
                    { type: 'boolean' },
                    { type: 'object' },
                    { type: 'array' }
                ]
            }
        },
        required: ['attributeName', 'attributeValue']
    }
};

export const getBlockAttributesTool: SuggerenceMCPResponseTool = {
    name: 'get_block_attributes',
    description: 'Get all current attribute values for a block',
    inputSchema: {
        type: 'object',
        properties: {
            blockId: {
                type: 'string',
                description: 'Block client ID (optional, uses selected block if not provided)'
            }
        }
    }
};

export const setTextColorTool: SuggerenceMCPResponseTool = {
    name: 'set_text_color',
    description: 'Set text color for blocks that support text color (paragraph, heading, etc.)',
    inputSchema: {
        type: 'object',
        properties: {
            blockId: {
                type: 'string',
                description: 'Block client ID (optional, uses selected block if not provided)'
            },
            color: {
                type: 'string',
                description: 'Color value (hex code like #ff0000, or CSS color name like red)'
            }
        },
        required: ['color']
    }
};

export const setBackgroundColorTool: SuggerenceMCPResponseTool = {
    name: 'set_background_color',
    description: 'Set background color for blocks that support background color',
    inputSchema: {
        type: 'object',
        properties: {
            blockId: {
                type: 'string',
                description: 'Block client ID (optional, uses selected block if not provided)'
            },
            color: {
                type: 'string',
                description: 'Color value (hex code like #ff0000, or CSS color name like red)'
            }
        },
        required: ['color']
    }
};

export const setImageAltTool: SuggerenceMCPResponseTool = {
    name: 'set_image_alt',
    description: 'Set alt text for image blocks',
    inputSchema: {
        type: 'object',
        properties: {
            blockId: {
                type: 'string',
                description: 'Block client ID (optional, uses selected block if not provided)'
            },
            altText: {
                type: 'string',
                description: 'Alt text for the image'
            }
        },
        required: ['altText']
    }
};

export const setImageSizeTool: SuggerenceMCPResponseTool = {
    name: 'set_image_size',
    description: 'Set width and/or height for image blocks',
    inputSchema: {
        type: 'object',
        properties: {
            blockId: {
                type: 'string',
                description: 'Block client ID (optional, uses selected block if not provided)'
            },
            width: {
                type: 'number',
                description: 'Width in pixels (optional)'
            },
            height: {
                type: 'number',
                description: 'Height in pixels (optional)'
            }
        }
    }
};

// Implementation functions
export function setBlockAttribute(
    blockId: string | undefined,
    attributeName: string,
    attributeValue: any
): { content: Array<{ type: string, text: string }> } {
    try {
        const { getSelectedBlockClientId, getBlock } = select('core/block-editor') as any;
        const { updateBlockAttributes } = dispatch('core/block-editor') as any;

        const targetBlockId = blockId || getSelectedBlockClientId();

        if (!targetBlockId) {
            return {
                content: [{
                    type: 'text',
                    text: 'No block selected or specified'
                }]
            };
        }

        // Get the block to verify it exists
        const block = getBlock(targetBlockId);
        if (!block) {
            return {
                content: [{
                    type: 'text',
                    text: `Block with ID ${targetBlockId} not found`
                }]
            };
        }

        // Update the attribute
        updateBlockAttributes(targetBlockId, {
            [attributeName]: attributeValue
        });

        return {
            content: [{
                type: 'text',
                text: `Successfully set ${attributeName} to ${JSON.stringify(attributeValue)} for block ${block.name} (ID: ${targetBlockId})`
            }]
        };
    } catch (error) {
        return {
            content: [{
                type: 'text',
                text: `Error setting block attribute: ${error instanceof Error ? error.message : 'Unknown error'}`
            }]
        };
    }
}

export function getBlockAttributes(blockId?: string): { content: Array<{ type: string, text: string }> } {
    try {
        const { getSelectedBlockClientId, getBlock } = select('core/block-editor') as any;

        const targetBlockId = blockId || getSelectedBlockClientId();

        if (!targetBlockId) {
            return {
                content: [{
                    type: 'text',
                    text: 'No block selected or specified'
                }]
            };
        }

        const block = getBlock(targetBlockId);
        if (!block) {
            return {
                content: [{
                    type: 'text',
                    text: `Block with ID ${targetBlockId} not found`
                }]
            };
        }

        const result = {
            blockId: targetBlockId,
            blockType: block.name,
            attributes: block.attributes || {}
        };

        return {
            content: [{
                type: 'text',
                text: JSON.stringify(result, null, 2)
            }]
        };
    } catch (error) {
        return {
            content: [{
                type: 'text',
                text: `Error getting block attributes: ${error instanceof Error ? error.message : 'Unknown error'}`
            }]
        };
    }
}

export function setTextColor(blockId: string | undefined, color: string): { content: Array<{ type: string, text: string }> } {
    return setBlockAttribute(blockId, 'textColor', color);
}

export function setBackgroundColor(blockId: string | undefined, color: string): { content: Array<{ type: string, text: string }> } {
    return setBlockAttribute(blockId, 'backgroundColor', color);
}

export function setImageAlt(blockId: string | undefined, altText: string): { content: Array<{ type: string, text: string }> } {
    return setBlockAttribute(blockId, 'alt', altText);
}

export function setImageSize(
    blockId: string | undefined,
    width?: number,
    height?: number
): { content: Array<{ type: string, text: string }> } {
    try {
        const { getSelectedBlockClientId, getBlock } = select('core/block-editor') as any;
        const { updateBlockAttributes } = dispatch('core/block-editor') as any;

        const targetBlockId = blockId || getSelectedBlockClientId();

        if (!targetBlockId) {
            return {
                content: [{
                    type: 'text',
                    text: 'No block selected or specified'
                }]
            };
        }

        const block = getBlock(targetBlockId);
        if (!block) {
            return {
                content: [{
                    type: 'text',
                    text: `Block with ID ${targetBlockId} not found`
                }]
            };
        }

        const updates: any = {};
        if (width !== undefined) updates.width = width;
        if (height !== undefined) updates.height = height;

        if (Object.keys(updates).length === 0) {
            return {
                content: [{
                    type: 'text',
                    text: 'No width or height specified'
                }]
            };
        }

        updateBlockAttributes(targetBlockId, updates);

        return {
            content: [{
                type: 'text',
                text: `Successfully updated image size for block ${block.name} (ID: ${targetBlockId}): ${JSON.stringify(updates)}`
            }]
        };
    } catch (error) {
        return {
            content: [{
                type: 'text',
                text: `Error setting image size: ${error instanceof Error ? error.message : 'Unknown error'}`
            }]
        };
    }
}