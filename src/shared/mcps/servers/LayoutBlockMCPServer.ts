import { SuggerenceMCPServerConnection, SuggerenceMCPResponseTool } from '../types';
import {
    setBlockAttributeTool,
    getBlockAttributesTool,
    setBackgroundColorTool,
    setBlockAttribute,
    getBlockAttributes,
    setBackgroundColor,
    modifyCurrentBlockTool
} from '../tools/block-attributes';

export class LayoutBlockMCPServer {
    static initialize(): SuggerenceMCPServerConnection {
        return {
            name: 'layout-block',
            title: 'Layout Block Tools',
            description: 'MCP server for layout blocks (group, columns, cover, etc.)',
            protocol_version: '1.0.0',
            endpoint_url: 'http://localhost:3004',
            is_active: true,
            type: 'frontend',
            connected: true,
            client: new LayoutBlockMCPServer(),
            id: 5,
            capabilities: '',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        }
    }

    private tools: SuggerenceMCPResponseTool[] = [
        // Basic layout styling
        // setBackgroundColorTool,
        // {
        //     name: 'set_layout_background',
        //     description: 'Set comprehensive background properties for layout blocks',
        //     inputSchema: {
        //         type: 'object',
        //         properties: {
        //             background: {
        //                 type: 'object',
        //                 properties: {
        //                     color: { type: 'string', description: 'Background color' },
        //                     gradient: { type: 'string', description: 'Background gradient' },
        //                     image: { type: 'string', description: 'Background image URL' },
        //                     size: { type: 'string', enum: ['auto', 'cover', 'contain', 'custom'], description: 'Background size' },
        //                     position: { type: 'string', description: 'Background position (e.g., "center center", "top left")' },
        //                     repeat: { type: 'string', enum: ['repeat', 'no-repeat', 'repeat-x', 'repeat-y'], description: 'Background repeat' },
        //                     attachment: { type: 'string', enum: ['scroll', 'fixed', 'local'], description: 'Background attachment' },
        //                     blendMode: { type: 'string', enum: ['normal', 'multiply', 'screen', 'overlay', 'darken', 'lighten'], description: 'Background blend mode' }
        //                 }
        //             }
        //         },
        //         required: ['background']
        //     }
        // },

        // // Flexbox layout controls
        // {
        //     name: 'set_flexbox_layout',
        //     description: 'Configure flexbox properties for layout blocks',
        //     inputSchema: {
        //         type: 'object',
        //         properties: {
        //             flexbox: {
        //                 type: 'object',
        //                 properties: {
        //                     display: { type: 'string', enum: ['flex', 'inline-flex'], description: 'Display type' },
        //                     direction: { type: 'string', enum: ['row', 'row-reverse', 'column', 'column-reverse'], description: 'Flex direction' },
        //                     wrap: { type: 'string', enum: ['nowrap', 'wrap', 'wrap-reverse'], description: 'Flex wrap' },
        //                     justifyContent: { type: 'string', enum: ['flex-start', 'flex-end', 'center', 'space-between', 'space-around', 'space-evenly'], description: 'Justify content' },
        //                     alignItems: { type: 'string', enum: ['stretch', 'flex-start', 'flex-end', 'center', 'baseline'], description: 'Align items' },
        //                     alignContent: { type: 'string', enum: ['stretch', 'flex-start', 'flex-end', 'center', 'space-between', 'space-around'], description: 'Align content' },
        //                     gap: { type: 'string', description: 'Gap between items (e.g., "1rem", "20px")' },
        //                     rowGap: { type: 'string', description: 'Row gap' },
        //                     columnGap: { type: 'string', description: 'Column gap' }
        //                 }
        //             }
        //         },
        //         required: ['flexbox']
        //     }
        // },

        // // Grid layout controls
        // {
        //     name: 'set_grid_layout',
        //     description: 'Configure CSS Grid properties for layout blocks',
        //     inputSchema: {
        //         type: 'object',
        //         properties: {
        //             grid: {
        //                 type: 'object',
        //                 properties: {
        //                     display: { type: 'string', enum: ['grid', 'inline-grid'], description: 'Display type' },
        //                     templateColumns: { type: 'string', description: 'Grid template columns (e.g., "1fr 1fr 1fr", "repeat(3, 1fr)")' },
        //                     templateRows: { type: 'string', description: 'Grid template rows (e.g., "auto 200px auto")' },
        //                     templateAreas: { type: 'string', description: 'Grid template areas' },
        //                     autoColumns: { type: 'string', description: 'Grid auto columns' },
        //                     autoRows: { type: 'string', description: 'Grid auto rows' },
        //                     autoFlow: { type: 'string', enum: ['row', 'column', 'row dense', 'column dense'], description: 'Grid auto flow' },
        //                     gap: { type: 'string', description: 'Grid gap' },
        //                     rowGap: { type: 'string', description: 'Grid row gap' },
        //                     columnGap: { type: 'string', description: 'Grid column gap' },
        //                     justifyItems: { type: 'string', enum: ['start', 'end', 'center', 'stretch'], description: 'Justify items' },
        //                     alignItems: { type: 'string', enum: ['start', 'end', 'center', 'stretch'], description: 'Align items' },
        //                     justifyContent: { type: 'string', enum: ['start', 'end', 'center', 'stretch', 'space-around', 'space-between', 'space-evenly'], description: 'Justify content' },
        //                     alignContent: { type: 'string', enum: ['start', 'end', 'center', 'stretch', 'space-around', 'space-between', 'space-evenly'], description: 'Align content' }
        //                 }
        //             }
        //         },
        //         required: ['grid']
        //     }
        // },

        // // Dimensions and sizing
        // {
        //     name: 'set_layout_dimensions',
        //     description: 'Set width, height, and sizing properties for layout blocks',
        //     inputSchema: {
        //         type: 'object',
        //         properties: {
        //             dimensions: {
        //                 type: 'object',
        //                 properties: {
        //                     width: { type: 'string', description: 'Width (e.g., "100%", "500px", "50vw")' },
        //                     height: { type: 'string', description: 'Height (e.g., "400px", "50vh", "auto")' },
        //                     minWidth: { type: 'string', description: 'Minimum width' },
        //                     maxWidth: { type: 'string', description: 'Maximum width' },
        //                     minHeight: { type: 'string', description: 'Minimum height' },
        //                     maxHeight: { type: 'string', description: 'Maximum height' },
        //                     aspectRatio: { type: 'string', description: 'Aspect ratio (e.g., "16/9", "1/1")' }
        //                 }
        //             }
        //         },
        //         required: ['dimensions']
        //     }
        // },

        // // Spacing controls
        // {
        //     name: 'set_layout_spacing',
        //     description: 'Set margin, padding, and spacing for layout blocks',
        //     inputSchema: {
        //         type: 'object',
        //         properties: {
        //             spacing: {
        //                 type: 'object',
        //                 properties: {
        //                     margin: {
        //                         type: 'object',
        //                         properties: {
        //                             top: { type: 'string' },
        //                             right: { type: 'string' },
        //                             bottom: { type: 'string' },
        //                             left: { type: 'string' }
        //                         }
        //                     },
        //                     padding: {
        //                         type: 'object',
        //                         properties: {
        //                             top: { type: 'string' },
        //                             right: { type: 'string' },
        //                             bottom: { type: 'string' },
        //                             left: { type: 'string' }
        //                         }
        //                     },
        //                     blockGap: { type: 'string', description: 'Gap between child blocks' }
        //                 }
        //             }
        //         },
        //         required: ['spacing']
        //     }
        // },

        // // Border and effects
        // {
        //     name: 'set_layout_border',
        //     description: 'Set border properties for layout blocks',
        //     inputSchema: {
        //         type: 'object',
        //         properties: {
        //             border: {
        //                 type: 'object',
        //                 properties: {
        //                     width: { type: 'string', description: 'Border width' },
        //                     style: { type: 'string', enum: ['solid', 'dashed', 'dotted', 'double', 'groove', 'ridge'], description: 'Border style' },
        //                     color: { type: 'string', description: 'Border color' },
        //                     radius: { type: 'string', description: 'Border radius' },
        //                     top: { type: 'object', properties: { width: { type: 'string' }, style: { type: 'string' }, color: { type: 'string' } } },
        //                     right: { type: 'object', properties: { width: { type: 'string' }, style: { type: 'string' }, color: { type: 'string' } } },
        //                     bottom: { type: 'object', properties: { width: { type: 'string' }, style: { type: 'string' }, color: { type: 'string' } } },
        //                     left: { type: 'object', properties: { width: { type: 'string' }, style: { type: 'string' }, color: { type: 'string' } } }
        //                 }
        //             }
        //         },
        //         required: ['border']
        //     }
        // },

        // {
        //     name: 'set_layout_shadow',
        //     description: 'Add shadow effects to layout blocks',
        //     inputSchema: {
        //         type: 'object',
        //         properties: {
        //             shadow: {
        //                 type: 'object',
        //                 properties: {
        //                     x: { type: 'string', description: 'X offset' },
        //                     y: { type: 'string', description: 'Y offset' },
        //                     blur: { type: 'string', description: 'Blur radius' },
        //                     spread: { type: 'string', description: 'Spread radius' },
        //                     color: { type: 'string', description: 'Shadow color' },
        //                     inset: { type: 'boolean', description: 'Inset shadow' }
        //                 }
        //             }
        //         },
        //         required: ['shadow']
        //     }
        // },

        // // Positioning
        // {
        //     name: 'set_layout_position',
        //     description: 'Set positioning properties for layout blocks',
        //     inputSchema: {
        //         type: 'object',
        //         properties: {
        //             position: {
        //                 type: 'object',
        //                 properties: {
        //                     type: { type: 'string', enum: ['static', 'relative', 'absolute', 'fixed', 'sticky'], description: 'Position type' },
        //                     top: { type: 'string', description: 'Top offset' },
        //                     right: { type: 'string', description: 'Right offset' },
        //                     bottom: { type: 'string', description: 'Bottom offset' },
        //                     left: { type: 'string', description: 'Left offset' },
        //                     zIndex: { type: 'string', description: 'Z-index' }
        //                 }
        //             }
        //         },
        //         required: ['position']
        //     }
        // },

        // // Overflow and visibility
        // {
        //     name: 'set_layout_overflow',
        //     description: 'Control overflow and visibility for layout blocks',
        //     inputSchema: {
        //         type: 'object',
        //         properties: {
        //             overflow: {
        //                 type: 'object',
        //                 properties: {
        //                     overflow: { type: 'string', enum: ['visible', 'hidden', 'scroll', 'auto'], description: 'Overflow behavior' },
        //                     overflowX: { type: 'string', enum: ['visible', 'hidden', 'scroll', 'auto'], description: 'Horizontal overflow' },
        //                     overflowY: { type: 'string', enum: ['visible', 'hidden', 'scroll', 'auto'], description: 'Vertical overflow' },
        //                     visibility: { type: 'string', enum: ['visible', 'hidden', 'collapse'], description: 'Visibility' },
        //                     opacity: { type: 'string', description: 'Opacity (0-1)' }
        //                 }
        //             }
        //         },
        //         required: ['overflow']
        //     }
        // },

        // // Cover block specific tools
        // {
        //     name: 'set_cover_overlay',
        //     description: 'Configure overlay properties for cover blocks',
        //     inputSchema: {
        //         type: 'object',
        //         properties: {
        //             overlay: {
        //                 type: 'object',
        //                 properties: {
        //                     color: { type: 'string', description: 'Overlay color' },
        //                     gradient: { type: 'string', description: 'Overlay gradient' },
        //                     opacity: { type: 'string', description: 'Overlay opacity (0-1)' },
        //                     blendMode: { type: 'string', enum: ['normal', 'multiply', 'screen', 'overlay', 'darken', 'lighten'], description: 'Blend mode' }
        //                 }
        //             }
        //         },
        //         required: ['overlay']
        //     }
        // },

        // {
        //     name: 'set_cover_content_position',
        //     description: 'Set content positioning within cover blocks',
        //     inputSchema: {
        //         type: 'object',
        //         properties: {
        //             contentPosition: {
        //                 type: 'string',
        //                 enum: ['top left', 'top center', 'top right', 'center left', 'center center', 'center right', 'bottom left', 'bottom center', 'bottom right'],
        //                 description: 'Content position within cover'
        //             }
        //         },
        //         required: ['contentPosition']
        //     }
        // },

        // // Transformations
        // {
        //     name: 'transform_layout',
        //     description: 'Apply transformations to layout blocks',
        //     inputSchema: {
        //         type: 'object',
        //         properties: {
        //             transform: {
        //                 type: 'object',
        //                 properties: {
        //                     rotate: { type: 'string', description: 'Rotation' },
        //                     scale: { type: 'string', description: 'Scale' },
        //                     translateX: { type: 'string', description: 'X translation' },
        //                     translateY: { type: 'string', description: 'Y translation' },
        //                     skew: { type: 'string', description: 'Skew transformation' },
        //                     perspective: { type: 'string', description: 'Perspective' }
        //                 }
        //             }
        //         },
        //         required: ['transform']
        //     }
        // },

        modifyCurrentBlockTool
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
                case 'set_background_color':
                    return setBackgroundColor(undefined, args.color);

                case 'set_layout_background':
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
                            backgroundAttachment: args.background.attachment,
                            backgroundBlendMode: args.background.blendMode
                        }
                    });

                case 'set_flexbox_layout':
                    return setBlockAttribute(undefined, 'style', {
                        layout: {
                            type: 'flex',
                            ...args.flexbox
                        }
                    });

                case 'set_grid_layout':
                    return setBlockAttribute(undefined, 'style', {
                        layout: {
                            type: 'grid',
                            ...args.grid
                        }
                    });

                case 'set_layout_dimensions':
                    return setBlockAttribute(undefined, 'style', {
                        dimensions: args.dimensions
                    });

                case 'set_layout_spacing':
                    return setBlockAttribute(undefined, 'style', {
                        spacing: args.spacing
                    });

                case 'set_layout_border':
                    return setBlockAttribute(undefined, 'style', {
                        border: args.border
                    });

                case 'set_layout_shadow':
                    const shadowValue = `${args.shadow.x || '0'} ${args.shadow.y || '0'} ${args.shadow.blur || '0'} ${args.shadow.spread || '0'} ${args.shadow.color || 'rgba(0,0,0,0.3)'}${args.shadow.inset ? ' inset' : ''}`;
                    return setBlockAttribute(undefined, 'style', {
                        shadow: shadowValue
                    });

                case 'set_layout_position':
                    return setBlockAttribute(undefined, 'style', {
                        position: args.position
                    });

                case 'set_layout_overflow':
                    return setBlockAttribute(undefined, 'style', {
                        ...args.overflow
                    });

                case 'set_cover_overlay':
                    return setBlockAttribute(undefined, 'style', {
                        color: {
                            overlay: args.overlay.color,
                            gradient: args.overlay.gradient
                        },
                        overlay: {
                            opacity: args.overlay.opacity,
                            blendMode: args.overlay.blendMode
                        }
                    });

                case 'set_cover_content_position':
                    return setBlockAttribute(undefined, 'contentPosition', args.contentPosition);

                case 'transform_layout':
                    return setBlockAttribute(undefined, 'style', {
                        transform: args.transform
                    });

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