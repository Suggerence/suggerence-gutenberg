import { SuggerenceMCPServerConnection, SuggerenceMCPResponseTool } from '../types';
import {
    setBlockAttributeTool,
    getBlockAttributesTool,
    setTextColorTool,
    setBackgroundColorTool,
    setBlockAttribute,
    getBlockAttributes,
    setTextColor,
    setBackgroundColor
} from '../tools/block-attributes';

export class TextBlockMCPServer {
    static initialize(): SuggerenceMCPServerConnection {
        return {
            name: 'text-block',
            title: 'Text Block Tools',
            description: 'MCP server for text blocks (paragraph, heading, quote, etc.)',
            protocol_version: '1.0.0',
            endpoint_url: 'http://localhost:3001',
            is_active: true,
            type: 'frontend',
            connected: true,
            client: new TextBlockMCPServer(),
            id: 2,
            capabilities: '',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        }
    }

    private tools: SuggerenceMCPResponseTool[] = [
        // Basic text styling
        setTextColorTool,
        setBackgroundColorTool,
        {
            name: 'set_font_size',
            description: 'Set font size for text blocks',
            inputSchema: {
                type: 'object',
                properties: {
                    fontSize: { type: 'string', description: 'Font size (e.g., "16px", "1.2em", "large")' }
                },
                required: ['fontSize']
            }
        },
        {
            name: 'set_text_alignment',
            description: 'Set text alignment for text blocks',
            inputSchema: {
                type: 'object',
                properties: {
                    alignment: { type: 'string', enum: ['left', 'center', 'right', 'justify'], description: 'Text alignment' }
                },
                required: ['alignment']
            }
        },

        // Advanced typography
        {
            name: 'set_typography',
            description: 'Set comprehensive typography properties',
            inputSchema: {
                type: 'object',
                properties: {
                    typography: {
                        type: 'object',
                        properties: {
                            fontFamily: { type: 'string', description: 'Font family (e.g., "Arial", "var(--wp--preset--font-family--roboto)")' },
                            fontSize: { type: 'string', description: 'Font size (e.g., "16px", "1.2em")' },
                            fontStyle: { type: 'string', enum: ['normal', 'italic', 'oblique'], description: 'Font style' },
                            fontWeight: { type: 'string', description: 'Font weight (e.g., "400", "bold", "700")' },
                            letterSpacing: { type: 'string', description: 'Letter spacing (e.g., "0.1em", "2px")' },
                            lineHeight: { type: 'string', description: 'Line height (e.g., "1.6", "24px")' },
                            textDecoration: { type: 'string', enum: ['none', 'underline', 'overline', 'line-through'], description: 'Text decoration' },
                            textTransform: { type: 'string', enum: ['none', 'capitalize', 'uppercase', 'lowercase'], description: 'Text transform' },
                            writingMode: { type: 'string', enum: ['horizontal-tb', 'vertical-rl', 'vertical-lr'], description: 'Writing mode' },
                            textShadow: { type: 'string', description: 'Text shadow (e.g., "2px 2px 4px rgba(0,0,0,0.5)")' }
                        }
                    }
                },
                required: ['typography']
            }
        },

        // Text effects
        {
            name: 'set_text_gradient',
            description: 'Apply gradient color to text',
            inputSchema: {
                type: 'object',
                properties: {
                    gradient: { type: 'string', description: 'CSS gradient (e.g., "linear-gradient(135deg, #667eea 0%, #764ba2 100%)")' }
                },
                required: ['gradient']
            }
        },

        {
            name: 'set_text_shadow',
            description: 'Add shadow effects to text',
            inputSchema: {
                type: 'object',
                properties: {
                    shadow: {
                        type: 'object',
                        properties: {
                            x: { type: 'string', description: 'X offset (e.g., "2px")' },
                            y: { type: 'string', description: 'Y offset (e.g., "2px")' },
                            blur: { type: 'string', description: 'Blur radius (e.g., "4px")' },
                            color: { type: 'string', description: 'Shadow color (e.g., "rgba(0,0,0,0.5)")' }
                        }
                    }
                },
                required: ['shadow']
            }
        },

        // Rich text formatting
        {
            name: 'format_text_rich',
            description: 'Apply rich text formatting (bold, italic, underline, etc.) to specific text content',
            inputSchema: {
                type: 'object',
                properties: {
                    content: { type: 'string', description: 'Text content to format' },
                    formatting: {
                        type: 'object',
                        properties: {
                            bold: { type: 'boolean', description: 'Apply bold formatting' },
                            italic: { type: 'boolean', description: 'Apply italic formatting' },
                            underline: { type: 'boolean', description: 'Apply underline' },
                            strikethrough: { type: 'boolean', description: 'Apply strikethrough' },
                            color: { type: 'string', description: 'Text color' },
                            backgroundColor: { type: 'string', description: 'Background color' },
                            fontSize: { type: 'string', description: 'Font size' },
                            link: { type: 'string', description: 'URL for link' }
                        }
                    }
                },
                required: ['content', 'formatting']
            }
        },

        // Border and spacing for text blocks
        {
            name: 'set_text_border',
            description: 'Set border properties for text block',
            inputSchema: {
                type: 'object',
                properties: {
                    border: {
                        type: 'object',
                        properties: {
                            width: { type: 'string', description: 'Border width (e.g., "2px")' },
                            style: { type: 'string', enum: ['solid', 'dashed', 'dotted', 'double'], description: 'Border style' },
                            color: { type: 'string', description: 'Border color' },
                            radius: { type: 'string', description: 'Border radius (e.g., "5px")' },
                            top: { type: 'object', properties: { width: { type: 'string' }, style: { type: 'string' }, color: { type: 'string' } } },
                            right: { type: 'object', properties: { width: { type: 'string' }, style: { type: 'string' }, color: { type: 'string' } } },
                            bottom: { type: 'object', properties: { width: { type: 'string' }, style: { type: 'string' }, color: { type: 'string' } } },
                            left: { type: 'object', properties: { width: { type: 'string' }, style: { type: 'string' }, color: { type: 'string' } } }
                        }
                    }
                },
                required: ['border']
            }
        },

        {
            name: 'set_text_spacing',
            description: 'Set margin and padding for text block',
            inputSchema: {
                type: 'object',
                properties: {
                    spacing: {
                        type: 'object',
                        properties: {
                            margin: {
                                type: 'object',
                                properties: {
                                    top: { type: 'string' },
                                    right: { type: 'string' },
                                    bottom: { type: 'string' },
                                    left: { type: 'string' }
                                }
                            },
                            padding: {
                                type: 'object',
                                properties: {
                                    top: { type: 'string' },
                                    right: { type: 'string' },
                                    bottom: { type: 'string' },
                                    left: { type: 'string' }
                                }
                            }
                        }
                    }
                },
                required: ['spacing']
            }
        },

        // Text positioning and layout
        {
            name: 'set_text_position',
            description: 'Set positioning properties for text block',
            inputSchema: {
                type: 'object',
                properties: {
                    position: {
                        type: 'object',
                        properties: {
                            type: { type: 'string', enum: ['static', 'relative', 'absolute', 'fixed', 'sticky'], description: 'Position type' },
                            top: { type: 'string', description: 'Top offset' },
                            right: { type: 'string', description: 'Right offset' },
                            bottom: { type: 'string', description: 'Bottom offset' },
                            left: { type: 'string', description: 'Left offset' },
                            zIndex: { type: 'string', description: 'Z-index' }
                        }
                    }
                },
                required: ['position']
            }
        },

        // Text overlays and backgrounds
        {
            name: 'set_text_background',
            description: 'Set advanced background properties for text block',
            inputSchema: {
                type: 'object',
                properties: {
                    background: {
                        type: 'object',
                        properties: {
                            color: { type: 'string', description: 'Background color' },
                            gradient: { type: 'string', description: 'Background gradient' },
                            image: { type: 'string', description: 'Background image URL' },
                            size: { type: 'string', enum: ['auto', 'cover', 'contain'], description: 'Background size' },
                            position: { type: 'string', description: 'Background position' },
                            repeat: { type: 'string', enum: ['repeat', 'no-repeat', 'repeat-x', 'repeat-y'], description: 'Background repeat' },
                            attachment: { type: 'string', enum: ['scroll', 'fixed', 'local'], description: 'Background attachment' }
                        }
                    }
                },
                required: ['background']
            }
        },

        // Heading-specific tools
        {
            name: 'set_heading_level',
            description: 'Set heading level for heading blocks (H1-H6)',
            inputSchema: {
                type: 'object',
                properties: {
                    level: { type: 'number', minimum: 1, maximum: 6, description: 'Heading level (1-6)' }
                },
                required: ['level']
            }
        },

        // Text transforms and animations
        {
            name: 'transform_text',
            description: 'Apply transformations to text block',
            inputSchema: {
                type: 'object',
                properties: {
                    transform: {
                        type: 'object',
                        properties: {
                            rotate: { type: 'string', description: 'Rotation (e.g., "5deg")' },
                            scale: { type: 'string', description: 'Scale (e.g., "1.1")' },
                            translateX: { type: 'string', description: 'X translation' },
                            translateY: { type: 'string', description: 'Y translation' },
                            skew: { type: 'string', description: 'Skew transformation' }
                        }
                    }
                },
                required: ['transform']
            }
        },

        getBlockAttributesTool,
        setBlockAttributeTool
    ];

    listTools(): { tools: SuggerenceMCPResponseTool[] } {
        return {
            tools: this.tools
        };
    }

    async callTool(params: { name: string, arguments: Record<string, any> }): Promise<{ content: Array<{ type: string, text: string }> }> {
        const { name, arguments: args } = params;

        try {
            switch (name) {
                // Basic text styling
                case 'set_text_color':
                    return setTextColor(undefined, args.color);

                case 'set_background_color':
                    return setBackgroundColor(undefined, args.color);

                case 'set_font_size':
                    return setBlockAttribute(undefined, 'fontSize', args.fontSize);

                case 'set_text_alignment':
                    return setBlockAttribute(undefined, 'align', args.alignment);

                // Advanced typography
                case 'set_typography':
                    return setBlockAttribute(undefined, 'style', {
                        typography: args.typography
                    });

                // Text effects
                case 'set_text_gradient':
                    return setBlockAttribute(undefined, 'style', {
                        color: {
                            gradient: args.gradient
                        }
                    });

                case 'set_text_shadow':
                    const shadowValue = `${args.shadow.x || '0'} ${args.shadow.y || '0'} ${args.shadow.blur || '0'} ${args.shadow.color || 'rgba(0,0,0,0.5)'}`;
                    return setBlockAttribute(undefined, 'style', {
                        typography: {
                            textShadow: shadowValue
                        }
                    });

                // Rich text formatting
                case 'format_text_rich':
                    // This would need special handling for rich text content formatting
                    // For now, we'll apply the formatting to the entire block
                    const richTextStyle: any = {};
                    if (args.formatting.bold) richTextStyle.fontWeight = 'bold';
                    if (args.formatting.italic) richTextStyle.fontStyle = 'italic';
                    if (args.formatting.color) richTextStyle.color = args.formatting.color;
                    if (args.formatting.backgroundColor) richTextStyle.backgroundColor = args.formatting.backgroundColor;
                    if (args.formatting.fontSize) richTextStyle.fontSize = args.formatting.fontSize;

                    return setBlockAttribute(undefined, 'style', {
                        typography: richTextStyle
                    });

                // Border and spacing
                case 'set_text_border':
                    return setBlockAttribute(undefined, 'style', {
                        border: args.border
                    });

                case 'set_text_spacing':
                    return setBlockAttribute(undefined, 'style', {
                        spacing: args.spacing
                    });

                // Positioning
                case 'set_text_position':
                    return setBlockAttribute(undefined, 'style', {
                        position: args.position
                    });

                // Advanced backgrounds
                case 'set_text_background':
                    return setBlockAttribute(undefined, 'style', {
                        color: {
                            background: args.background.color,
                            gradient: args.background.gradient
                        },
                        background: {
                            backgroundImage: args.background.image,
                            backgroundSize: args.background.size,
                            backgroundPosition: args.background.position,
                            backgroundRepeat: args.background.repeat,
                            backgroundAttachment: args.background.attachment
                        }
                    });

                // Heading-specific
                case 'set_heading_level':
                    return setBlockAttribute(undefined, 'level', args.level);

                // Transformations
                case 'transform_text':
                    return setBlockAttribute(undefined, 'style', {
                        transform: args.transform
                    });

                // Generic tools
                case 'get_block_attributes':
                    return getBlockAttributes(args.blockId);

                case 'set_block_attribute':
                    return setBlockAttribute(undefined, args.attributeName, args.attributeValue);

                default:
                    throw new Error(`Unknown tool: ${name}`);
            }
        } catch (error) {
            return {
                content: [{
                    type: 'text',
                    text: `Error executing ${name}: ${error instanceof Error ? error.message : 'Unknown error'}`
                }]
            };
        }
    }
}