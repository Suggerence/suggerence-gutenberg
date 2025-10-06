import { select } from '@wordpress/data';

export const getAvailableBlocksTool: SuggerenceMCPResponseTool = {
    name: 'get_available_blocks',
    description: 'Retrieves a comprehensive list of all WordPress Gutenberg block types registered in the current editor, including their metadata and capabilities. Use this tool when you need to discover what block types are available, explore blocks in a specific category, or determine the correct block type identifier for an add_block or update_block operation. Useful for understanding the user\'s available tools and suggesting appropriate block types for their needs.',
    inputSchema: {
        type: 'object',
        properties: {
            includeInactive: {
                type: 'boolean',
                description: 'If true, includes deprecated and private block types in the results. If false (default), returns only active, user-facing blocks. Set to true only when you need a complete technical inventory including deprecated blocks. Most use cases should keep this false to avoid suggesting obsolete block types.'
            },
            category: {
                type: 'string',
                description: 'Filters results to blocks in a specific WordPress category. Valid categories: "text" (paragraphs, headings, lists), "media" (images, videos, galleries), "design" (buttons, spacers, separators, columns), "widgets" (archives, calendars, tag clouds), "theme" (navigation, site logo, query loops), "embed" (YouTube, Twitter, etc.). Use this to narrow down results when looking for blocks with a specific purpose. Leave empty to get all blocks.'
            }
        }
    }
};

export const getBlockSchemaTool: SuggerenceMCPResponseTool = {
    name: 'get_block_schema',
    description: 'Fetches the complete technical schema and configuration for a specific WordPress block type, including all available attributes, supported features, styling capabilities, and block relationships. MANDATORY: Use this tool BEFORE creating complex blocks like tables, galleries, embeds, or any block type you are unfamiliar with. Essential for understanding block capabilities, valid attribute names and types, attribute structure (especially for complex blocks), supported styling properties, and proper block configuration. Returns comprehensive metadata including attributes schema with default values, types, and structure that you MUST follow when calling creation tool.',
    inputSchema: {
        type: 'object',
        properties: {
            blockType: {
                type: 'string',
                description: 'The exact block type identifier to query. Must be a fully qualified block name including namespace, typically "core/block-name" for WordPress core blocks (e.g., "core/paragraph", "core/heading", "core/image", "core/button", "core/columns"). Custom blocks use their registered namespace (e.g., "my-plugin/custom-block"). Use get_available_blocks first if you\'re unsure of the exact identifier.',
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
        const filteredBlocks = includeInactive ? availableBlocks : availableBlocks.filter((block: any) => block.isActive);

        return {
            content: [{
                type: 'text',
                text: JSON.stringify({
                    success: true,
                    action: 'get_available_blocks_success',
                    totalBlocks: filteredBlocks.length,
                    blocks: filteredBlocks
                }, null, 2)
            }]
        };
    } catch (error) {
        return {
            content: [{
                type: 'text',
                text: JSON.stringify({
                    success: false,
                    action: 'get_available_blocks_failed',
                    error: `Error fetching available blocks: ${error instanceof Error ? error.message : 'Unknown error'}`
                })
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
                    text: JSON.stringify({
                        success: false,
                        action: 'get_block_schema_failed',
                        error: `Block type "${blockType}" not found. Use get_available_blocks to see available block types.`
                    })
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
                text: JSON.stringify({
                    success: true,
                    action: 'get_block_schema_success',
                    schema: schema
                }, null, 2)
            }]
        };
    } catch (error) {
        return {
            content: [{
                type: 'text',
                text: JSON.stringify({
                    success: false,
                    action: 'get_block_schema_failed',
                    error: `Error fetching schema for block "${blockType}": ${error instanceof Error ? error.message : 'Unknown error'}`
                })
            }]
        };
    }
}