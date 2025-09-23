import { select, dispatch } from '@wordpress/data';
import { createBlock } from '@wordpress/blocks';
import {
    getCurrentBlockSchema,
    getEditableAttributes,
    getAttributeDescription,
    validateAttributeValue
} from '@/shared/utils/block-schema';

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

export const modifyCurrentBlockTool: SuggerenceMCPResponseTool = {
    name: 'modify_current_block',
    description: 'Perform any modification available in WordPress block settings sidebar and toolbar. Supports all block features including transforms, styling, content, and advanced settings.',
    inputSchema: {
        type: 'object',
        properties: {
            // Core block properties
            attributes: {
                type: 'object',
                description: 'Any block attributes including colors, typography, spacing, dimensions, media settings, etc. Supports all sidebar panel options.',
                additionalProperties: true
            },
            content: {
                type: 'string',
                description: 'Block content/text for text-based blocks'
            },
            innerBlocks: {
                type: 'array',
                description: 'Inner blocks for container blocks',
                items: { type: 'object', additionalProperties: true }
            },

            // Advanced styling and layout
            style: {
                type: 'object',
                description: 'Custom CSS styles and design tokens (spacing, colors, typography, borders, etc.)',
                additionalProperties: true
            },
            className: {
                type: 'string',
                description: 'CSS classes and design variations'
            },
            anchor: {
                type: 'string',
                description: 'HTML anchor/ID for the block'
            },

            // Block transformations
            transformTo: {
                type: 'string',
                description: 'Transform block to different type (e.g., "core/group", "core/cover")'
            },
            wrapIn: {
                type: 'string',
                description: 'Wrap block in a container (e.g., "core/group", "core/column")'
            },

            // Layout and positioning
            align: {
                type: 'string',
                description: 'Block alignment (left, center, right, wide, full)',
                enum: ['left', 'center', 'right', 'wide', 'full']
            },

            // Settings behavior
            partialUpdate: {
                type: 'boolean',
                description: 'Merge with existing properties vs replace completely',
                default: true
            },
            skipValidation: {
                type: 'boolean',
                description: 'Skip schema validation for advanced modifications',
                default: false
            },
            forceUpdate: {
                type: 'boolean',
                description: 'Apply changes even if they seem invalid',
                default: false
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

export function modifyCurrentBlock(
    blockModifications: {
        attributes?: Record<string, any>;
        content?: string;
        innerBlocks?: any[];
        style?: Record<string, any>;
        className?: string;
        anchor?: string;
        transformTo?: string;
        wrapIn?: string;
        align?: string;
        partialUpdate?: boolean;
        skipValidation?: boolean;
        forceUpdate?: boolean;
    }
): { content: Array<{ type: string, text: string }> } {
    const {
        attributes = {},
        content,
        innerBlocks,
        style,
        className,
        anchor,
        transformTo,
        wrapIn,
        align,
        partialUpdate = true,
        skipValidation = false,
        forceUpdate = false
    } = blockModifications;
    try {
        const { getSelectedBlockClientId, getBlock, getBlockRootClientId, getBlocks } = select('core/block-editor') as any;
        const {
            updateBlockAttributes,
            replaceInnerBlocks,
            replaceBlock,
            insertBlock,
            removeBlock,
            updateBlockListSettings
        } = dispatch('core/block-editor') as any;

        const targetBlockId = getSelectedBlockClientId();

        if (!targetBlockId) {
            return {
                content: [{
                    type: 'text',
                    text: 'No block selected'
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

        // Handle block transformations first (these create new blocks)
        if (transformTo) {
            try {
                const newBlock = createBlock(transformTo, {
                    ...currentBlock.attributes,
                    ...attributes
                }, currentBlock.innerBlocks);

                replaceBlock(targetBlockId, newBlock);

                return {
                    content: [{
                        type: 'text',
                        text: `Successfully transformed block from ${currentBlock.name} to ${transformTo}`
                    }]
                };
            } catch (error) {
                if (!forceUpdate) {
                    return {
                        content: [{
                            type: 'text',
                            text: `Failed to transform block to ${transformTo}: ${error instanceof Error ? error.message : 'Unknown error'}`
                        }]
                    };
                }
            }
        }

        // Handle wrapping in container blocks
        if (wrapIn) {
            try {
                const wrapperBlock = createBlock(wrapIn, {}, [currentBlock]);

                replaceBlock(targetBlockId, wrapperBlock);

                return {
                    content: [{
                        type: 'text',
                        text: `Successfully wrapped block ${currentBlock.name} in ${wrapIn}`
                    }]
                };
            } catch (error) {
                if (!forceUpdate) {
                    return {
                        content: [{
                            type: 'text',
                            text: `Failed to wrap block in ${wrapIn}: ${error instanceof Error ? error.message : 'Unknown error'}`
                        }]
                    };
                }
            }
        }

        // Get block schema for validation and information
        const blockSchema = getCurrentBlockSchema();
        let schemaInfo = '';
        let validationErrors: string[] = [];

        if (blockSchema) {
            const editableAttributes = getEditableAttributes(blockSchema.name);

            // Provide schema information about available attributes
            const availableAttrs = Object.keys(editableAttributes).map(attrName => {
                const schema = editableAttributes[attrName];
                return getAttributeDescription(attrName, schema);
            });

            schemaInfo = `\n\nBlock: ${blockSchema.title} (${blockSchema.name})\nAvailable editable attributes:\n${availableAttrs.join('\n')}`;

            // Validate attributes if requested and not skipped
            if (!skipValidation && Object.keys(attributes).length > 0) {
                Object.entries(attributes).forEach(([attrName, value]) => {
                    if (blockSchema.attributes[attrName]) {
                        const validation = validateAttributeValue(value, blockSchema.attributes[attrName]);
                        if (!validation.valid) {
                            validationErrors.push(`${attrName}: ${validation.error}`);
                        }
                    } else {
                        // Warn about unknown attributes but don't fail
                        validationErrors.push(`${attrName}: not found in block schema (will still be applied)`);
                    }
                });

                if (validationErrors.length > 0) {
                    const hasErrors = validationErrors.some(error => !error.includes('not found in block schema'));
                    if (hasErrors) {
                        return {
                            content: [{
                                type: 'text',
                                text: `Validation failed:\n${validationErrors.join('\n')}${schemaInfo}`
                            }]
                        };
                    }
                }
            }
        }

        // Prepare attributes to update
        let finalAttributes = { ...currentBlock.attributes };

        if (partialUpdate) {
            // Merge with existing attributes
            Object.keys(attributes).forEach(key => {
                if (key === 'style' && typeof attributes.style === 'object') {
                    // Deep merge for style attribute
                    finalAttributes.style = {
                        ...finalAttributes.style,
                        ...attributes.style
                    };
                } else {
                    finalAttributes[key] = attributes[key];
                }
            });
        } else {
            // Replace specified attributes completely
            finalAttributes = { ...finalAttributes, ...attributes };
        }

        // Handle content for blocks that support it
        if (content !== undefined) {
            const contentAttribute = blockSchema?.attributes.content ? 'content' :
                                   blockSchema?.attributes.text ? 'text' :
                                   blockSchema?.attributes.value ? 'value' : null;

            if (contentAttribute) {
                finalAttributes[contentAttribute] = content;
            }
        }

        // Handle style as an attribute (WordPress stores styles in attributes.style)
        if (style !== undefined) {
            if (partialUpdate && finalAttributes.style) {
                finalAttributes.style = { ...finalAttributes.style, ...style };
            } else {
                finalAttributes.style = style;
            }
        }

        // Handle className
        if (className !== undefined) {
            finalAttributes.className = className;
        }

        // Handle anchor (HTML ID)
        if (anchor !== undefined) {
            finalAttributes.anchor = anchor;
        }

        // Handle block alignment
        if (align !== undefined) {
            finalAttributes.align = align;
        }

        // Allow any attribute modifications, even if not in schema (for advanced use cases)
        if (skipValidation || forceUpdate) {
            Object.entries(attributes).forEach(([key, value]) => {
                if (partialUpdate) {
                    if (key === 'style' && typeof value === 'object' && finalAttributes.style) {
                        finalAttributes.style = { ...finalAttributes.style, ...value };
                    } else {
                        finalAttributes[key] = value;
                    }
                } else {
                    finalAttributes[key] = value;
                }
            });
        }

        // Update block attributes
        updateBlockAttributes(targetBlockId, finalAttributes);

        // Handle inner blocks if provided
        if (innerBlocks !== undefined) {
            replaceInnerBlocks(targetBlockId, innerBlocks);
        }

        // Build result message with all modifications applied
        const modificationsApplied = [];

        if (Object.keys(attributes).length > 0) {
            modificationsApplied.push(`attributes: ${Object.keys(attributes).join(', ')}`);
        }
        if (content !== undefined) {
            modificationsApplied.push('content');
        }
        if (style !== undefined) {
            modificationsApplied.push('style');
        }
        if (className !== undefined) {
            modificationsApplied.push('className');
        }
        if (innerBlocks !== undefined) {
            modificationsApplied.push(`innerBlocks (${innerBlocks.length} blocks)`);
        }

        let resultMessage = `Successfully modified block ${currentBlock.name} (ID: ${targetBlockId}) with ${partialUpdate ? 'partial' : 'complete'} update`;

        if (modificationsApplied.length > 0) {
            resultMessage += `\nModifications applied: ${modificationsApplied.join(', ')}`;
        }

        if (validationErrors.length > 0 && skipValidation) {
            resultMessage += `\n\nValidation warnings:\n${validationErrors.join('\n')}`;
        }

        if (blockSchema && !skipValidation && Object.keys(attributes).length > 0) {
            resultMessage += '\nAll attributes validated against block schema ✓';
        }

        resultMessage += schemaInfo;

        return {
            content: [{
                type: 'text',
                text: resultMessage
            }]
        };
    } catch (error) {
        return {
            content: [{
                type: 'text',
                text: `Error modifying block: ${error instanceof Error ? error.message : 'Unknown error'}`
            }]
        };
    }
}