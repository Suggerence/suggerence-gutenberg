import { select } from '@wordpress/data';

export const getAvailableBlocksTool: SuggerenceMCPResponseTool = {
    name: 'get_available_blocks',
    description: 'Get list of all available Gutenberg block types with their basic information',
    inputSchema: {
        type: 'object',
        properties: {
            includeInactive: {
                type: 'boolean',
                description: 'Whether to include inactive block types (default: false)'
            },
            category: {
                type: 'string',
                description: 'Filter blocks by category (text, media, design, widgets, theme, embed)'
            }
        }
    }
};

export const getBlockSchemaTool: SuggerenceMCPResponseTool = {
    name: 'get_block_schema',
    description: 'Get detailed JSON schema and metadata for a specific block type',
    inputSchema: {
        type: 'object',
        properties: {
            blockType: {
                type: 'string',
                description: 'The block type name (e.g., "core/paragraph", "core/heading")',
                required: true
            }
        },
        required: ['blockType']
    }
};

export function getAvailableBlocks(includeInactive: boolean = false, category?: string): { content: Array<{ type: string, text: string }> } {
    try {
        const { getBlockTypes } = select('core/blocks') as any;

        let blockTypes = getBlockTypes();

        // Filter by category if specified
        if (category) {
            blockTypes = blockTypes.filter((blockType: any) => blockType.category === category);
        }

        const availableBlocks = blockTypes.map((blockType: any) => ({
            name: blockType.name,
            title: blockType.title,
            description: blockType.description || '',
            category: blockType.category,
            icon: typeof blockType.icon === 'string' ? blockType.icon : blockType.icon?.src || '',
            keywords: blockType.keywords || [],
            supports: blockType.supports || {},
            isActive: !blockType.deprecated && !blockType.private
        }));

        // Filter inactive blocks if requested
        const filteredBlocks = includeInactive ? availableBlocks : availableBlocks.filter(block => block.isActive);

        return {
            content: [{
                type: 'text',
                text: JSON.stringify({
                    totalBlocks: filteredBlocks.length,
                    blocks: filteredBlocks
                }, null, 2)
            }]
        };
    } catch (error) {
        return {
            content: [{
                type: 'text',
                text: `Error fetching available blocks: ${error instanceof Error ? error.message : 'Unknown error'}`
            }]
        };
    }
}

export function getBlockSchema(blockType: string): { content: Array<{ type: string, text: string }> } {
    try {
        const { getBlockType } = select('core/blocks') as any;

        const blockDefinition = getBlockType(blockType);

        if (!blockDefinition) {
            return {
                content: [{
                    type: 'text',
                    text: `Block type "${blockType}" not found. Use get_available_blocks to see available block types.`
                }]
            };
        }

        const schema = {
            name: blockDefinition.name,
            title: blockDefinition.title,
            description: blockDefinition.description || '',
            category: blockDefinition.category,
            icon: typeof blockDefinition.icon === 'string' ? blockDefinition.icon : blockDefinition.icon?.src || '',
            keywords: blockDefinition.keywords || [],
            supports: blockDefinition.supports || {},
            attributes: blockDefinition.attributes || {},
            example: blockDefinition.example || null,
            variations: blockDefinition.variations || [],
            transforms: {
                from: blockDefinition.transforms?.from || [],
                to: blockDefinition.transforms?.to || []
            },
            parent: blockDefinition.parent || null,
            ancestor: blockDefinition.ancestor || null,
            allowedBlocks: blockDefinition.allowedBlocks || null,
            usesContext: blockDefinition.usesContext || [],
            providesContext: blockDefinition.providesContext || {},
            selectors: blockDefinition.selectors || {},
            deprecated: blockDefinition.deprecated || [],
            merge: !!blockDefinition.merge,
            save: !!blockDefinition.save,
            edit: !!blockDefinition.edit
        };

        return {
            content: [{
                type: 'text',
                text: JSON.stringify(schema, null, 2)
            }]
        };
    } catch (error) {
        return {
            content: [{
                type: 'text',
                text: `Error fetching schema for block "${blockType}": ${error instanceof Error ? error.message : 'Unknown error'}`
            }]
        };
    }
}