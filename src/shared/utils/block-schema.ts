import { getBlockType } from '@wordpress/blocks';
import { select } from '@wordpress/data';

export interface BlockAttributeSchema {
    type: string;
    source?: string;
    selector?: string;
    attribute?: string;
    query?: Record<string, any>;
    default?: any;
    enum?: string[];
    role?: string;
    description?: string;
}

export interface BlockSchema {
    name: string;
    title: string;
    description?: string;
    category: string;
    icon?: any;
    keywords?: string[];
    attributes: Record<string, BlockAttributeSchema>;
    supports?: Record<string, any>;
    example?: Record<string, any>;
}

/**
 * Get block schema from WordPress block registry
 */
export function getBlockSchema(blockName: string): BlockSchema | null {
    try {
        const blockType = getBlockType(blockName);

        if (!blockType) {
            return null;
        }

        return {
            name: blockType.name,
            title: blockType.title,
            description: blockType.description,
            category: blockType.category,
            icon: blockType.icon,
            keywords: blockType.keywords,
            attributes: blockType.attributes || {},
            supports: blockType.supports || {},
            example: blockType.example
        };
    } catch (error) {
        console.error(`Error getting block schema for ${blockName}:`, error);
        return null;
    }
}

/**
 * Get current block's schema
 */
export function getCurrentBlockSchema(): BlockSchema | null {
    try {
        const { getSelectedBlockClientId, getBlock } = select('core/block-editor') as any;

        const blockId = getSelectedBlockClientId();
        if (!blockId) {
            return null;
        }

        const block = getBlock(blockId);
        if (!block) {
            return null;
        }

        return getBlockSchema(block.name);
    } catch (error) {
        console.error('Error getting current block schema:', error);
        return null;
    }
}

/**
 * Get all available block schemas
 */
export function getAllBlockSchemas(): Record<string, BlockSchema> {
    try {
        const { getBlockTypes } = select('core/blocks') as any;
        const blockTypes = getBlockTypes();

        const schemas: Record<string, BlockSchema> = {};

        blockTypes.forEach((blockType: any) => {
            const schema = getBlockSchema(blockType.name);
            if (schema) {
                schemas[blockType.name] = schema;
            }
        });

        return schemas;
    } catch (error) {
        console.error('Error getting all block schemas:', error);
        return {};
    }
}

/**
 * Get attribute schema for a specific attribute of a block
 */
export function getAttributeSchema(blockName: string, attributeName: string): BlockAttributeSchema | null {
    const blockSchema = getBlockSchema(blockName);

    if (!blockSchema || !blockSchema.attributes[attributeName]) {
        return null;
    }

    return blockSchema.attributes[attributeName];
}

/**
 * Get all editable attributes for a block based on block.json schema and supports
 */
export function getEditableAttributes(blockName: string): Record<string, BlockAttributeSchema> {
    const blockSchema = getBlockSchema(blockName);

    if (!blockSchema) {
        return {};
    }

    // Start with all attributes from block.json - these are all potentially editable
    const editableAttributes: Record<string, BlockAttributeSchema> = { ...blockSchema.attributes };

    // Add attributes based on supports (these define additional capabilities)
    if (blockSchema.supports) {
        const supports = blockSchema.supports;

        // Color support adds color attributes
        if (supports.color) {
            if (supports.color.background !== false) {
                editableAttributes.backgroundColor = { type: 'string', description: 'Background color' };
            }
            if (supports.color.text !== false) {
                editableAttributes.textColor = { type: 'string', description: 'Text color' };
            }
            if (supports.color.gradients !== false) {
                editableAttributes.gradient = { type: 'string', description: 'Gradient background' };
            }
            if (supports.color.duotone !== false) {
                editableAttributes.duotone = { type: 'array', description: 'Duotone filter colors' };
            }
        }

        // Typography support
        if (supports.typography) {
            if (supports.typography.fontSize !== false) {
                editableAttributes.fontSize = { type: 'string', description: 'Font size' };
            }
            if (supports.typography.fontFamily !== false) {
                editableAttributes.fontFamily = { type: 'string', description: 'Font family' };
            }
            if (supports.typography.fontWeight !== false) {
                editableAttributes.fontWeight = { type: 'string', description: 'Font weight' };
            }
            if (supports.typography.lineHeight !== false) {
                editableAttributes.lineHeight = { type: 'string', description: 'Line height' };
            }
        }

        // Spacing support
        if (supports.spacing) {
            if (supports.spacing.padding !== false) {
                editableAttributes.style = { type: 'object', description: 'Spacing and layout styles' };
            }
            if (supports.spacing.margin !== false) {
                editableAttributes.style = { type: 'object', description: 'Spacing and layout styles' };
            }
        }

        // Border support
        if (supports.border) {
            editableAttributes.style = { type: 'object', description: 'Border and styling' };
        }

        // Dimensions support
        if (supports.dimensions) {
            if (supports.dimensions.minHeight !== false) {
                editableAttributes.style = { type: 'object', description: 'Dimensions and sizing' };
            }
        }

        // Position support
        if (supports.position) {
            editableAttributes.style = { type: 'object', description: 'Position and layout' };
        }

        // Layout support
        if (supports.layout !== false) {
            editableAttributes.layout = { type: 'object', description: 'Layout configuration' };
        }

        // Anchor support
        if (supports.anchor !== false) {
            editableAttributes.anchor = { type: 'string', description: 'HTML anchor/ID' };
        }

        // Custom class names
        if (supports.customClassName !== false) {
            editableAttributes.className = { type: 'string', description: 'Custom CSS classes' };
        }

        // Alignment support
        if (supports.align !== false) {
            const alignOptions = Array.isArray(supports.align) ? supports.align : ['left', 'center', 'right', 'wide', 'full'];
            editableAttributes.align = {
                type: 'string',
                description: 'Block alignment',
                enum: alignOptions
            };
        }
    }

    return editableAttributes;
}

/**
 * Generate human-readable description of an attribute based on its schema
 */
export function getAttributeDescription(attributeName: string, schema: BlockAttributeSchema): string {
    const typeDescriptions: Record<string, string> = {
        'string': 'text value',
        'number': 'numeric value',
        'boolean': 'true/false value',
        'object': 'structured data',
        'array': 'list of items'
    };

    let description = `${attributeName} (${typeDescriptions[schema.type] || schema.type})`;

    if (schema.default !== undefined) {
        description += ` - default: ${JSON.stringify(schema.default)}`;
    }

    if (schema.enum && schema.enum.length > 0) {
        description += ` - options: ${schema.enum.join(', ')}`;
    }

    return description;
}

/**
 * Validate attribute value against schema
 */
export function validateAttributeValue(value: any, schema: BlockAttributeSchema): { valid: boolean; error?: string } {
    // Basic type validation
    if (schema.type === 'string' && typeof value !== 'string') {
        return { valid: false, error: 'Value must be a string' };
    }

    if (schema.type === 'number' && typeof value !== 'number') {
        return { valid: false, error: 'Value must be a number' };
    }

    if (schema.type === 'boolean' && typeof value !== 'boolean') {
        return { valid: false, error: 'Value must be a boolean' };
    }

    // Enum validation
    if (schema.enum && !schema.enum.includes(value)) {
        return { valid: false, error: `Value must be one of: ${schema.enum.join(', ')}` };
    }

    return { valid: true };
}