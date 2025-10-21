import { select } from '@wordpress/data';

export const getAvailableBlocksTool: SuggerenceMCPResponseTool = {
    name: 'get_available_blocks',
    description: 'Retrieves a comprehensive list of all WordPress Gutenberg block types registered in the current editor, including their metadata and capabilities. Use this tool when you need to discover what block types are available, explore blocks in a specific category, or determine the correct block type identifier for an add_block or update_block operation. Useful for understanding the user\'s available tools and suggesting appropriate block types for their needs.',
    inputSchema: {
        type: 'object',
        properties: {
            include_inactive: {
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
    description: 'Fetches the complete technical schema for a WordPress block type, including attributes, supports (for styling like duotone, borders, spacing, typography), and usage examples. MANDATORY: Call this BEFORE every add_block or update_block operation to see: 1) All available attributes (content, URLs, IDs) 2) All supported style properties (duotone filters, border radius, padding, colors) 3) Usage examples for complex features 4) Correct data types and structure. The schema response includes a usageGuide with examples for advanced features like duotone filters, circular borders, and spacing. Without calling this first, you cannot know what style properties are available for that block.',
    inputSchema: {
        type: 'object',
        properties: {
            block_type: {
                type: 'string',
                description: 'The exact block type identifier to query. Must be a fully qualified block name including namespace, typically "core/block-name" for WordPress core blocks (e.g., "core/paragraph", "core/heading", "core/image", "core/button", "core/columns"). Custom blocks use their registered namespace (e.g., "my-plugin/custom-block"). Use get_available_blocks first if you\'re unsure of the exact identifier.',
                required: true
            }
        },
        required: ['block_type']
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

/**
 * Sanitizes complex attribute definitions for AI consumption
 * Removes React objects, functions, and deeply nested structures
 */
function sanitizeAttributes(attributes: any): any {
    if (!attributes || typeof attributes !== 'object') {
        return attributes;
    }

    const sanitized: any = {};

    for (const [key, attr] of Object.entries(attributes)) {
        if (typeof attr !== 'object' || attr === null) {
            sanitized[key] = attr;
            continue;
        }

        const attrObj = attr as any;

        // Only include relevant attribute metadata for AI
        sanitized[key] = {
            type: attrObj.type,
            default: sanitizeValue(attrObj.default),
            ...(attrObj.enum && { enum: attrObj.enum }),
            ...(attrObj.source && { source: attrObj.source }),
            ...(attrObj.selector && { selector: attrObj.selector }),
            ...(attrObj.attribute && { attribute: attrObj.attribute }),
        };
    }

    return sanitized;
}

/**
 * Sanitizes attribute values, handling arrays and objects recursively
 * Limits depth to prevent token explosion with complex custom blocks
 */
function sanitizeValue(value: any, depth: number = 0): any {
    // Limit recursion depth to prevent massive schemas
    if (depth > 3) {
        return typeof value === 'object' ? '[Complex Object]' : value;
    }

    // Handle null/undefined
    if (value == null) return value;

    // Handle primitives
    if (typeof value !== 'object') return value;

    // Handle React elements and functions
    if (typeof value === 'function' || value.$$typeof || value._owner !== undefined) {
        return '[React Component]';
    }

    // Handle arrays
    if (Array.isArray(value)) {
        // For large arrays with identical structure, show first item only
        if (value.length > 2 && typeof value[0] === 'object') {
            return [sanitizeValue(value[0], depth + 1), `... (${value.length - 1} more items)`];
        }
        return value.map(v => sanitizeValue(v, depth + 1));
    }

    // Handle objects
    const sanitized: any = {};
    const keys = Object.keys(value);

    // Limit object keys to prevent massive schemas
    const keysToProcess = keys.slice(0, 20);
    const hasMore = keys.length > 20;

    for (const key of keysToProcess) {
        // Skip React-specific keys
        if (key === '$$typeof' || key === '_owner' || key === 'ref' || key === 'props' || key === 'type' || key === 'key') {
            continue;
        }

        sanitized[key] = sanitizeValue(value[key], depth + 1);
    }

    if (hasMore) {
        sanitized['...'] = `(${keys.length - 20} more properties)`;
    }

    return sanitized;
}

/**
 * Creates a focused, AI-friendly example from block definition
 */
function createExample(blockDefinition: any): any {
    const example = blockDefinition.example;

    if (!example) return null;

    return {
        attributes: sanitizeValue(example.attributes || {}, 0),
        ...(example.innerBlocks && {
            innerBlocks: example.innerBlocks.slice(0, 2).map((block: any) => ({
                name: block.name,
                attributes: sanitizeValue(block.attributes || {}, 0),
                ...(block.innerBlocks && { hasInnerBlocks: true })
            }))
        })
    };
}

/**
 * Sanitizes variations to remove React components
 */
function sanitizeVariations(variations: any[]): any[] {
    if (!Array.isArray(variations)) return [];

    return variations.map(variation => ({
        name: variation.name,
        title: variation.title,
        description: variation.description,
        category: variation.category,
        keywords: variation.keywords,
        isDefault: variation.isDefault,
        attributes: sanitizeValue(variation.attributes || {}, 0),
        ...(variation.innerBlocks && {
            innerBlocks: variation.innerBlocks.slice(0, 2).map((block: any) => ({
                name: block.name,
                attributes: sanitizeValue(block.attributes || {}, 0)
            }))
        })
    }));
}

/**
 * Sanitizes transforms to show only essential info
 */
function sanitizeTransforms(transforms: any): any {
    if (!transforms) return null;

    return {
        from: transforms.from?.map((t: any) => ({
            type: t.type,
            blocks: t.blocks,
            ...(t.priority && { priority: t.priority })
        })) || [],
        to: transforms.to?.map((t: any) => ({
            type: t.type,
            blocks: t.blocks,
            ...(t.priority && { priority: t.priority })
        })) || []
    };
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

        const supports = blockDefinition.supports || {};

        // Build AI-friendly schema
        const schema = {
            name: blockDefinition.name,
            title: blockDefinition.title,
            description: blockDefinition.description || '',
            category: blockDefinition.category,
            keywords: blockDefinition.keywords || [],
            supports: supports,
            attributes: sanitizeAttributes(blockDefinition.attributes || {}),
            example: createExample(blockDefinition),
            variations: sanitizeVariations(blockDefinition.variations || []),
            transforms: sanitizeTransforms(blockDefinition.transforms),
            parent: blockDefinition.parent || null,
            ancestor: blockDefinition.ancestor || null,
            allowedBlocks: blockDefinition.allowedBlocks || null,
            usesContext: blockDefinition.usesContext || [],
            providesContext: blockDefinition.providesContext || {},
        };

        // Add helpful usage guide
        const usageGuide: string[] = [];

        // Add attribute examples for important attributes
        const attrs = blockDefinition.attributes || {};
        const importantAttrs = Object.entries(attrs)
            .filter(([key, attr]: [string, any]) => {
                // Filter for commonly used attributes that aren't styling
                return !key.includes('Style') &&
                       !key.includes('Color') &&
                       !key.includes('Border') &&
                       !key.includes('Padding') &&
                       !key.includes('Margin') &&
                       attr.type !== 'object' ||
                       (attr.type === 'array' && key.includes('inner'));
            })
            .slice(0, 5);

        if (importantAttrs.length > 0) {
            usageGuide.push('KEY ATTRIBUTES: ' + importantAttrs.map(([key, attr]: [string, any]) =>
                `${key} (${attr.type})`
            ).join(', '));
        }

        // Document supported style features
        if (supports.anchor) {
            usageGuide.push('ANCHOR: Block supports HTML anchor attribute for linking. Use attributes.anchor with string value.');
        }

        if (supports.align) {
            usageGuide.push('ALIGN: Block supports alignment. Use attributes.align with values: "left", "center", "right", "wide", "full".');
        }

        if (supports.color?.background !== false) {
            usageGuide.push('BACKGROUND COLOR: Use style.color.background with hex color. Example: style: {color: {background: "#f0f0f0"}}');
        }

        if (supports.color?.text !== false) {
            usageGuide.push('TEXT COLOR: Use style.color.text with hex color. Example: style: {color: {text: "#333333"}}');
        }

        if (supports.color?.duotone !== false) {
            usageGuide.push('DUOTONE FILTER: Use style.color.duotone with array of 2 colors ["#highlightColor", "#shadowColor"]. Example: style: {color: {duotone: ["#8c4bff", "#000000"]}}');
        }

        if (supports.color?.gradient !== false) {
            usageGuide.push('GRADIENT: Use style.color.gradient with CSS gradient. Example: style: {color: {gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"}}');
        }

        if (supports.border?.color !== false) {
            usageGuide.push('BORDER COLOR: Use style.border.color with hex color. Example: style: {border: {color: "#cccccc"}}');
        }

        if (supports.border?.radius !== false) {
            usageGuide.push('BORDER RADIUS: Use style.border.radius with CSS value. Examples: "50%" for circle, "10px" for rounded corners, "0" for square');
        }

        if (supports.border?.width !== false) {
            usageGuide.push('BORDER WIDTH: Use style.border.width with CSS value. Example: style: {border: {width: "2px"}}');
        }

        if (supports.border?.style !== false) {
            usageGuide.push('BORDER STYLE: Use style.border.style with CSS value. Example: style: {border: {style: "solid"}}');
        }

        if (supports.spacing?.padding !== false) {
            usageGuide.push('PADDING: Use style.spacing.padding with object {top, right, bottom, left}. Example: style: {spacing: {padding: {top: "20px", left: "10px"}}}');
        }

        if (supports.spacing?.margin !== false) {
            usageGuide.push('MARGIN: Use style.spacing.margin with object {top, right, bottom, left}. Example: style: {spacing: {margin: {bottom: "30px"}}}');
        }

        if (supports.spacing?.blockGap !== false) {
            usageGuide.push('BLOCK GAP: Use style.spacing.blockGap for space between inner blocks. Example: style: {spacing: {blockGap: "20px"}}');
        }

        if (supports.typography?.fontSize !== false) {
            usageGuide.push('FONT SIZE: Use style.typography.fontSize with CSS value. Example: style: {typography: {fontSize: "18px"}}');
        }

        if (supports.typography?.lineHeight !== false) {
            usageGuide.push('LINE HEIGHT: Use style.typography.lineHeight with CSS value. Example: style: {typography: {lineHeight: "1.5"}}');
        }

        if (supports.typography?.fontWeight !== false) {
            usageGuide.push('FONT WEIGHT: Use style.typography.fontWeight with CSS value. Example: style: {typography: {fontWeight: "bold"}}');
        }

        if (supports.dimensions?.minHeight !== false) {
            usageGuide.push('MIN HEIGHT: Use style.dimensions.minHeight with CSS value. Example: style: {dimensions: {minHeight: "300px"}}');
        }

        if (blockDefinition.example?.innerBlocks) {
            usageGuide.push(`INNER BLOCKS: This block accepts inner blocks. Check example for structure. Common inner blocks: ${blockDefinition.example.innerBlocks.map((b: any) => b.name).join(', ')}`);
        }

        return {
            content: [{
                type: 'text',
                text: JSON.stringify({
                    success: true,
                    action: 'get_block_schema_success',
                    schema: schema,
                    usageGuide: usageGuide.length > 0 ? usageGuide : undefined
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