import { getBlockType } from '@wordpress/blocks';
import { SuggerenceMCPResponseTool } from '../mcps/types';

export interface BlockSupports {
    color?: {
        background?: boolean;
        text?: boolean;
        gradients?: boolean;
        duotone?: boolean;
        link?: boolean;
        heading?: boolean;
    };
    typography?: {
        fontSize?: boolean;
        fontFamily?: boolean;
        fontWeight?: boolean;
        fontStyle?: boolean;
        lineHeight?: boolean;
        letterSpacing?: boolean;
        textDecoration?: boolean;
        textTransform?: boolean;
    };
    spacing?: {
        padding?: boolean;
        margin?: boolean;
        blockGap?: boolean;
    };
    border?: {
        color?: boolean;
        radius?: boolean;
        style?: boolean;
        width?: boolean;
    };
    __experimentalBorder?: {
        color?: boolean;
        radius?: boolean;
        style?: boolean;
        width?: boolean;
        __experimentalSkipSerialization?: boolean;
        __experimentalDefaultControls?: {
            color?: boolean;
            radius?: boolean;
            width?: boolean;
        };
    };
    dimensions?: {
        minHeight?: boolean;
        aspectRatio?: boolean;
    };
    position?: {
        sticky?: boolean;
    };
    layout?: boolean | object;
    anchor?: boolean;
    className?: boolean;
    customClassName?: boolean;
    align?: boolean | string[];
    alignWide?: boolean;
    multiple?: boolean;
    inserter?: boolean;
    lock?: boolean;
    html?: boolean;
    reusable?: boolean;
}

/**
 * Generate a comprehensive tool schema based on block's attributes and supports
 */
export function generateDynamicBlockTool(blockName: string): SuggerenceMCPResponseTool | null {
    const blockType = getBlockType(blockName);

    if (!blockType) {
        return null;
    }

    const attributes = blockType.attributes || {};
    const supports = blockType.supports as BlockSupports || {};

    // Build the tool schema dynamically
    const toolSchema: any = {
        type: 'object',
        properties: {
            blockId: {
                type: 'string',
                description: 'Block client ID (optional, uses selected block if not provided)'
            }
        }
    };

    // Add all block-specific attributes from block.json
    const attributeProperties: any = {};
    Object.entries(attributes).forEach(([name, schema]: [string, any]) => {
        attributeProperties[name] = {
            type: schema.type,
            description: `${name} attribute - ${schema.type}${schema.default !== undefined ? ` (default: ${JSON.stringify(schema.default)})` : ''}`,
            ...(schema.enum && { enum: schema.enum }),
            ...(schema.type === 'object' && { additionalProperties: true }),
            ...(schema.type === 'array' && { items: schema.items || { type: 'string' } })
        };
    });

    if (Object.keys(attributeProperties).length > 0) {
        toolSchema.properties.attributes = {
            type: 'object',
            description: `Block-specific attributes from ${blockName} schema (content, URLs, etc.) - NOT for styling`,
            properties: attributeProperties,
            additionalProperties: false
        };
    }

    // Generate style properties based on supports
    const styleProperties: any = {};

    // Color support
    if (supports.color) {
        styleProperties.color = {
            type: 'object',
            description: 'Color-related styles',
            properties: {}
        };

        if (supports.color.background !== false) {
            styleProperties.color.properties.background = {
                type: 'string',
                description: 'Background color (hex, rgb, or color name)'
            };
        }

        if (supports.color.text !== false) {
            styleProperties.color.properties.text = {
                type: 'string',
                description: 'Text color (hex, rgb, or color name)'
            };
        }

        if (supports.color.duotone !== false) {
            styleProperties.color.properties.duotone = {
                type: 'array',
                description: 'Duotone filter colors [highlightColor, shadowColor]',
                items: { type: 'string' },
                minItems: 2,
                maxItems: 2
            };
        }

        if (supports.color.gradients !== false) {
            styleProperties.color.properties.gradient = {
                type: 'string',
                description: 'CSS gradient value'
            };
        }
    }

    // Typography support
    if (supports.typography) {
        styleProperties.typography = {
            type: 'object',
            description: 'Typography styles',
            properties: {}
        };

        if (supports.typography.fontSize !== false) {
            styleProperties.typography.properties.fontSize = {
                type: 'string',
                description: 'Font size (px, em, rem, etc.)'
            };
        }

        if (supports.typography.fontFamily !== false) {
            styleProperties.typography.properties.fontFamily = {
                type: 'string',
                description: 'Font family name'
            };
        }

        if (supports.typography.fontWeight !== false) {
            styleProperties.typography.properties.fontWeight = {
                type: 'string',
                description: 'Font weight (normal, bold, 100-900)'
            };
        }

        if (supports.typography.lineHeight !== false) {
            styleProperties.typography.properties.lineHeight = {
                type: 'string',
                description: 'Line height (unitless number or px/em value)'
            };
        }
    }

    // Spacing support
    if (supports.spacing) {
        styleProperties.spacing = {
            type: 'object',
            description: 'Spacing and layout',
            properties: {}
        };

        if (supports.spacing.padding !== false) {
            styleProperties.spacing.properties.padding = {
                type: 'object',
                description: 'Padding values',
                properties: {
                    top: { type: 'string', description: 'Top padding' },
                    right: { type: 'string', description: 'Right padding' },
                    bottom: { type: 'string', description: 'Bottom padding' },
                    left: { type: 'string', description: 'Left padding' }
                }
            };
        }

        if (supports.spacing.margin !== false) {
            styleProperties.spacing.properties.margin = {
                type: 'object',
                description: 'Margin values',
                properties: {
                    top: { type: 'string', description: 'Top margin' },
                    right: { type: 'string', description: 'Right margin' },
                    bottom: { type: 'string', description: 'Bottom margin' },
                    left: { type: 'string', description: 'Left margin' }
                }
            };
        }
    }

    // Border support (both regular and experimental)
    const borderSupport = supports.border || supports.__experimentalBorder;
    if (borderSupport) {
        styleProperties.border = {
            type: 'object',
            description: 'Border styles',
            properties: {}
        };

        if (borderSupport.width !== false) {
            styleProperties.border.properties.width = {
                type: 'string',
                description: 'Border width (px, em, etc.)'
            };
        }

        if (borderSupport.color !== false) {
            styleProperties.border.properties.color = {
                type: 'string',
                description: 'Border color'
            };
        }

        if (borderSupport.style !== false) {
            styleProperties.border.properties.style = {
                type: 'string',
                description: 'Border style (solid, dashed, dotted, etc.)',
                enum: ['solid', 'dashed', 'dotted', 'double', 'groove', 'ridge', 'inset', 'outset']
            };
        }

        if (borderSupport.radius !== false) {
            styleProperties.border.properties.radius = {
                type: 'string',
                description: 'Border radius - Use "50%" for round/circular, "10px" for rounded corners, "0" for square edges'
            };
        }
    }

    // Dimensions support
    if (supports.dimensions) {
        styleProperties.dimensions = {
            type: 'object',
            description: 'Dimension styles',
            properties: {}
        };

        if (supports.dimensions.minHeight !== false) {
            styleProperties.dimensions.properties.minHeight = {
                type: 'string',
                description: 'Minimum height (px, vh, etc.)'
            };
        }

        if (supports.dimensions.aspectRatio !== false) {
            styleProperties.dimensions.properties.aspectRatio = {
                type: 'string',
                description: 'Aspect ratio (16/9, 4/3, etc.)'
            };
        }
    }

    // Add style property if any style options exist
    if (Object.keys(styleProperties).length > 0) {
        toolSchema.properties.style = {
            type: 'object',
            description: 'WordPress style object for visual styling (colors, typography, spacing, borders) - SEPARATE from attributes',
            properties: styleProperties
        };
    }

    // Add other WordPress-level attributes based on supports
    if (supports.anchor !== false) {
        toolSchema.properties.anchor = {
            type: 'string',
            description: 'HTML anchor/ID for the block'
        };
    }

    if (supports.customClassName !== false) {
        toolSchema.properties.className = {
            type: 'string',
            description: 'Custom CSS classes'
        };
    }

    if (supports.align !== false) {
        const alignOptions = Array.isArray(supports.align)
            ? supports.align
            : ['left', 'center', 'right', 'wide', 'full'];

        toolSchema.properties.align = {
            type: 'string',
            description: 'Block alignment',
            enum: alignOptions
        };
    }

    // Build comprehensive description
    const capabilities = [];

    // Add block description if available
    let description = `Modify ${blockType.title} block`;
    if (blockType.description) {
        description += ` - ${blockType.description}`;
    }

    // List key capabilities
    if (Object.keys(attributeProperties).length > 0) {
        const keyAttributes = Object.keys(attributeProperties).slice(0, 5).join(', ');
        capabilities.push(`Attributes: ${keyAttributes}${Object.keys(attributeProperties).length > 5 ? ', ...' : ''}`);
    }

    if (supports.color && (supports.color.duotone !== false || supports.color.background !== false)) {
        const colorFeats = [];
        if (supports.color.duotone !== false) colorFeats.push('duotone filters');
        if (supports.color.background !== false) colorFeats.push('background colors');
        if (supports.color.text !== false) colorFeats.push('text colors');
        capabilities.push(`Colors: ${colorFeats.join(', ')}`);
    }

    if (supports.typography) {
        capabilities.push('Typography: font size, family, weight, line height');
    }

    if (supports.spacing) {
        capabilities.push('Spacing: padding, margins');
    }

    if (supports.border || supports.__experimentalBorder) {
        capabilities.push('Borders: width, color, style, radius (use 50% radius to make images round/circular)');
    }

    if (capabilities.length > 0) {
        description += `. Supports: ${capabilities.join('; ')}`;
    }

    description += `. Uses WordPress block.json schema and supports for ${blockName}. IMPORTANT: Use 'attributes' for content/URLs/IDs, use 'style' for visual styling (colors, borders, typography).`;

    // Create the final tool
    return {
        name: `modify_${blockName.replace('/', '_').replace('-', '_')}`,
        description,
        inputSchema: toolSchema
    };
}

/**
 * Generate tool description with all available options
 */
export function generateBlockCapabilityDescription(blockName: string): string {
    const blockType = getBlockType(blockName);

    if (!blockType) {
        return `Block type ${blockName} not found`;
    }

    const attributes = blockType.attributes || {};
    const supports = blockType.supports as BlockSupports || {};

    let description = `# ${blockType.title} (${blockName})\n\n`;

    // Add block description and purpose
    if (blockType.description) {
        description += `**Description**: ${blockType.description}\n\n`;
    }

    // Add context about what this block is used for
    const blockPurpose = getBlockPurposeDescription(blockName);
    if (blockPurpose) {
        description += `**Purpose**: ${blockPurpose}\n\n`;
    }

    // List attributes
    if (Object.keys(attributes).length > 0) {
        description += `## Available Attributes:\n`;
        Object.entries(attributes).forEach(([name, schema]: [string, any]) => {
            description += `- **${name}**: ${schema.type}`;
            if (schema.default !== undefined) {
                description += ` (default: ${JSON.stringify(schema.default)})`;
            }
            if (schema.enum) {
                description += ` - options: ${schema.enum.join(', ')}`;
            }
            description += '\n';
        });
        description += '\n';
    }

    // List supports
    description += `## Supported Features:\n`;
    const supportFeatures: string[] = [];

    if (supports.color) {
        const colorFeatures = [];
        if (supports.color.background !== false) colorFeatures.push('background color');
        if (supports.color.text !== false) colorFeatures.push('text color');
        if (supports.color.duotone !== false) colorFeatures.push('duotone filters');
        if (supports.color.gradients !== false) colorFeatures.push('gradients');
        if (colorFeatures.length > 0) {
            supportFeatures.push(`**Color**: ${colorFeatures.join(', ')}`);
        }
    }

    if (supports.typography) {
        const typoFeatures = [];
        if (supports.typography.fontSize !== false) typoFeatures.push('font size');
        if (supports.typography.fontFamily !== false) typoFeatures.push('font family');
        if (supports.typography.fontWeight !== false) typoFeatures.push('font weight');
        if (supports.typography.lineHeight !== false) typoFeatures.push('line height');
        if (typoFeatures.length > 0) {
            supportFeatures.push(`**Typography**: ${typoFeatures.join(', ')}`);
        }
    }

    if (supports.spacing) {
        const spacingFeatures = [];
        if (supports.spacing.padding !== false) spacingFeatures.push('padding');
        if (supports.spacing.margin !== false) spacingFeatures.push('margin');
        if (spacingFeatures.length > 0) {
            supportFeatures.push(`**Spacing**: ${spacingFeatures.join(', ')}`);
        }
    }

    const borderSupport = supports.border || supports.__experimentalBorder;
    if (borderSupport) {
        supportFeatures.push('**Border**: width, color, style, radius (50% radius = round/circular images)');
    }

    if (supports.dimensions) {
        const dimFeatures = [];
        if (supports.dimensions.minHeight !== false) dimFeatures.push('min height');
        if (supports.dimensions.aspectRatio !== false) dimFeatures.push('aspect ratio');
        if (dimFeatures.length > 0) {
            supportFeatures.push(`**Dimensions**: ${dimFeatures.join(', ')}`);
        }
    }

    if (supports.anchor !== false) supportFeatures.push('**Anchor**: HTML ID');
    if (supports.align !== false) supportFeatures.push('**Alignment**: block positioning');

    description += supportFeatures.join('\n- ') + '\n';

    return description;
}

/**
 * Get human-readable description of what each block type is used for
 */
function getBlockPurposeDescription(blockName: string): string {
    const purposes: Record<string, string> = {
        'core/image': 'Display images with captions, alt text, and advanced styling. Supports duotone filters, borders (including rounded/circular with border radius), and responsive sizing.',
        'core/paragraph': 'Basic text content with rich formatting. Supports typography, colors, and drop caps.',
        'core/heading': 'Create headings (H1-H6) with custom typography and styling for content hierarchy.',
        'core/button': 'Interactive buttons with links, custom colors, and styling. Can be used for calls-to-action.',
        'core/cover': 'Full-width sections with background images/videos and overlay text. Perfect for hero sections.',
        'core/group': 'Container block for grouping other blocks together with shared styling and layout.',
        'core/columns': 'Multi-column layouts for organizing content side by side.',
        'core/gallery': 'Display multiple images in various layouts (grid, masonry, slideshow).',
        'core/video': 'Embed video files with controls and poster images.',
        'core/audio': 'Embed audio files with playback controls.',
        'core/list': 'Ordered or unordered lists with custom styling and nesting.',
        'core/quote': 'Highlight quotes or testimonials with special formatting.',
        'core/table': 'Create data tables with headers, footers, and styling.',
        'core/code': 'Display code snippets with syntax highlighting and formatting.',
        'core/html': 'Add custom HTML code directly to the page.',
        'core/spacer': 'Add vertical spacing between blocks with adjustable height.',
        'core/separator': 'Visual dividers between content sections.',
        'core/embed': 'Embed content from external services (YouTube, Twitter, etc.).',
        'core/social-links': 'Display social media links with icons and styling.',
        'core/navigation': 'Site navigation menus with dropdowns and responsive behavior.',
        'core/site-logo': 'Display the site logo with linking options.',
        'core/site-title': 'Display the site title with typography controls.',
        'core/post-title': 'Display post titles with heading levels and styling.',
        'core/post-content': 'Display the main content of posts and pages.',
        'core/post-featured-image': 'Display the featured image of posts with sizing options.',
        'core/media-text': 'Combine media (image/video) with text content in a two-column layout.'
    };

    return purposes[blockName] || `WordPress block for ${blockName.split('/')[1]} functionality.`;
}