import { SuggerenceMCPServerConnection, SuggerenceMCPResponseTool } from '../types';
import {
    setBlockAttributeTool,
    getBlockAttributesTool,
    setImageAltTool,
    setImageSizeTool,
    modifyCurrentBlockTool,
    setBlockAttribute,
    getBlockAttributes,
    setImageAlt,
    setImageSize,
    modifyCurrentBlock
} from '../tools/block-attributes';

export class ImageBlockMCPServer {
    static initialize(): SuggerenceMCPServerConnection {
        return {
            name: 'image-block',
            title: 'Image Block Tools',
            description: 'MCP server for image blocks',
            protocol_version: '1.0.0',
            endpoint_url: 'http://localhost:3002',
            is_active: true,
            type: 'frontend',
            connected: true,
            client: new ImageBlockMCPServer(),
            id: 3,
            capabilities: '',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        }
    }

    private tools: SuggerenceMCPResponseTool[] = [
        // Basic image properties
        // setImageAltTool,
        // setImageSizeTool,
        // {
        //     name: 'set_image_link',
        //     description: 'Set link URL for image block',
        //     inputSchema: {
        //         type: 'object',
        //         properties: {
        //             url: { type: 'string', description: 'URL to link to (empty string to remove link)' },
        //             linkTarget: { type: 'string', enum: ['_blank', '_self'], description: 'Link target (optional)' }
        //         },
        //         required: ['url']
        //     }
        // },
        // {
        //     name: 'set_image_caption',
        //     description: 'Set caption for image block',
        //     inputSchema: {
        //         type: 'object',
        //         properties: {
        //             caption: { type: 'string', description: 'Caption text for the image' }
        //         },
        //         required: ['caption']
        //     }
        // },

        // // CSS Filters
        // {
        //     name: 'set_image_filter',
        //     description: 'Apply CSS filters to image (grayscale, blur, brightness, contrast, etc.)',
        //     inputSchema: {
        //         type: 'object',
        //         properties: {
        //             filter: {
        //                 type: 'object',
        //                 properties: {
        //                     blur: { type: 'string', description: 'Blur effect (e.g., "5px")' },
        //                     brightness: { type: 'string', description: 'Brightness (e.g., "120%")' },
        //                     contrast: { type: 'string', description: 'Contrast (e.g., "150%")' },
        //                     grayscale: { type: 'string', description: 'Grayscale (e.g., "100%")' },
        //                     sepia: { type: 'string', description: 'Sepia effect (e.g., "80%")' },
        //                     saturate: { type: 'string', description: 'Saturation (e.g., "200%")' },
        //                     hueRotate: { type: 'string', description: 'Hue rotation (e.g., "90deg")' },
        //                     invert: { type: 'string', description: 'Invert colors (e.g., "100%")' },
        //                     opacity: { type: 'string', description: 'Opacity (e.g., "80%")' },
        //                     dropShadow: { type: 'string', description: 'Drop shadow (e.g., "2px 2px 4px rgba(0,0,0,0.5)")' }
        //                 }
        //             }
        //         },
        //         required: ['filter']
        //     }
        // },

        // // Transform properties
        // {
        //     name: 'transform_image',
        //     description: 'Apply transformations to image (rotate, scale, translate, skew)',
        //     inputSchema: {
        //         type: 'object',
        //         properties: {
        //             transform: {
        //                 type: 'object',
        //                 properties: {
        //                     rotate: { type: 'string', description: 'Rotation (e.g., "45deg")' },
        //                     rotateX: { type: 'string', description: 'X-axis rotation (e.g., "30deg")' },
        //                     rotateY: { type: 'string', description: 'Y-axis rotation (e.g., "45deg")' },
        //                     rotateZ: { type: 'string', description: 'Z-axis rotation (e.g., "60deg")' },
        //                     scale: { type: 'string', description: 'Scale (e.g., "1.2")' },
        //                     scaleX: { type: 'string', description: 'X-axis scale (e.g., "1.1")' },
        //                     scaleY: { type: 'string', description: 'Y-axis scale (e.g., "0.9")' },
        //                     translateX: { type: 'string', description: 'X translation (e.g., "10px")' },
        //                     translateY: { type: 'string', description: 'Y translation (e.g., "20px")' },
        //                     skew: { type: 'string', description: 'Skew (e.g., "15deg")' },
        //                     skewX: { type: 'string', description: 'X-axis skew (e.g., "10deg")' },
        //                     skewY: { type: 'string', description: 'Y-axis skew (e.g., "5deg")' }
        //                 }
        //             }
        //         },
        //         required: ['transform']
        //     }
        // },

        // // Border and shadow effects
        // {
        //     name: 'set_image_border',
        //     description: 'Set comprehensive border properties for image',
        //     inputSchema: {
        //         type: 'object',
        //         properties: {
        //             border: {
        //                 type: 'object',
        //                 properties: {
        //                     width: { type: 'string', description: 'Border width (e.g., "2px")' },
        //                     style: { type: 'string', enum: ['solid', 'dashed', 'dotted', 'double', 'groove', 'ridge', 'inset', 'outset'], description: 'Border style' },
        //                     color: { type: 'string', description: 'Border color (e.g., "#333", "red")' },
        //                     radius: { type: 'string', description: 'Border radius (e.g., "10px", "50%")' },
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
        //     name: 'set_image_shadow',
        //     description: 'Add shadow effects to image',
        //     inputSchema: {
        //         type: 'object',
        //         properties: {
        //             shadow: {
        //                 type: 'object',
        //                 properties: {
        //                     x: { type: 'string', description: 'X offset (e.g., "5px")' },
        //                     y: { type: 'string', description: 'Y offset (e.g., "5px")' },
        //                     blur: { type: 'string', description: 'Blur radius (e.g., "10px")' },
        //                     spread: { type: 'string', description: 'Spread radius (e.g., "2px")' },
        //                     color: { type: 'string', description: 'Shadow color (e.g., "rgba(0,0,0,0.3)")' },
        //                     inset: { type: 'boolean', description: 'Inset shadow' }
        //                 }
        //             }
        //         },
        //         required: ['shadow']
        //     }
        // },

        // // Aspect ratio and object fit
        // {
        //     name: 'set_image_dimensions',
        //     description: 'Set aspect ratio and object fitting for image',
        //     inputSchema: {
        //         type: 'object',
        //         properties: {
        //             dimensions: {
        //                 type: 'object',
        //                 properties: {
        //                     aspectRatio: { type: 'string', description: 'Aspect ratio (e.g., "16/9", "1/1")' },
        //                     objectFit: { type: 'string', enum: ['contain', 'cover', 'fill', 'scale-down', 'none'], description: 'How image fits container' },
        //                     objectPosition: { type: 'string', description: 'Object position (e.g., "center center", "top left")' },
        //                     width: { type: 'string', description: 'Width (e.g., "100%", "300px")' },
        //                     height: { type: 'string', description: 'Height (e.g., "400px", "auto")' },
        //                     minHeight: { type: 'string', description: 'Minimum height (e.g., "200px")' }
        //                 }
        //             }
        //         },
        //         required: ['dimensions']
        //     }
        // },

        // // Overlay effects
        // {
        //     name: 'set_image_overlay',
        //     description: 'Add color or gradient overlay to image',
        //     inputSchema: {
        //         type: 'object',
        //         properties: {
        //             overlay: {
        //                 type: 'object',
        //                 properties: {
        //                     color: { type: 'string', description: 'Overlay color (e.g., "rgba(0,0,0,0.5)")' },
        //                     gradient: { type: 'string', description: 'Gradient overlay (e.g., "linear-gradient(135deg, rgba(255,0,0,0.5) 0%, rgba(0,0,255,0.5) 100%)")' },
        //                     blendMode: { type: 'string', enum: ['normal', 'multiply', 'screen', 'overlay', 'darken', 'lighten', 'color-dodge', 'color-burn', 'hard-light', 'soft-light', 'difference', 'exclusion'], description: 'Blend mode' },
        //                     opacity: { type: 'string', description: 'Overlay opacity (e.g., "0.8")' }
        //                 }
        //             }
        //         },
        //         required: ['overlay']
        //     }
        // },

        // // Positioning and layout
        // {
        //     name: 'set_image_position',
        //     description: 'Set positioning properties for image',
        //     inputSchema: {
        //         type: 'object',
        //         properties: {
        //             position: {
        //                 type: 'object',
        //                 properties: {
        //                     type: { type: 'string', enum: ['static', 'relative', 'absolute', 'fixed', 'sticky'], description: 'Position type' },
        //                     top: { type: 'string', description: 'Top offset (e.g., "20px")' },
        //                     right: { type: 'string', description: 'Right offset (e.g., "10px")' },
        //                     bottom: { type: 'string', description: 'Bottom offset (e.g., "0")' },
        //                     left: { type: 'string', description: 'Left offset (e.g., "auto")' },
        //                     zIndex: { type: 'string', description: 'Z-index (e.g., "999")' }
        //                 }
        //             }
        //         },
        //         required: ['position']
        //     }
        // },

        // // Spacing controls
        // {
        //     name: 'set_image_spacing',
        //     description: 'Set margin and padding for image',
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
        //                     }
        //                 }
        //             }
        //         },
        //         required: ['spacing']
        //     }
        // },

        // getBlockAttributesTool,
        // setBlockAttributeTool,
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
                // Basic image properties
                case 'set_image_alt':
                    return setImageAlt(undefined, args.altText);

                case 'set_image_size':
                    return setImageSize(undefined, args.width, args.height);

                case 'set_image_link':
                    return setBlockAttribute(undefined, 'href', args.url);

                case 'set_image_caption':
                    return setBlockAttribute(undefined, 'caption', args.caption);

                // CSS Filters
                case 'set_image_filter':
                    return setBlockAttribute(undefined, 'style', {
                        filter: args.filter
                    });

                // Transform properties
                case 'transform_image':
                    return setBlockAttribute(undefined, 'style', {
                        transform: args.transform
                    });

                // Border effects
                case 'set_image_border':
                    return setBlockAttribute(undefined, 'style', {
                        border: args.border
                    });

                // Shadow effects
                case 'set_image_shadow':
                    const shadowValue = `${args.shadow.x || '0'} ${args.shadow.y || '0'} ${args.shadow.blur || '0'} ${args.shadow.spread || '0'} ${args.shadow.color || 'rgba(0,0,0,0.3)'}${args.shadow.inset ? ' inset' : ''}`;
                    return setBlockAttribute(undefined, 'style', {
                        shadow: shadowValue
                    });

                // Dimensions and aspect ratio
                case 'set_image_dimensions':
                    return setBlockAttribute(undefined, 'style', {
                        dimensions: args.dimensions
                    });

                // Overlay effects
                case 'set_image_overlay':
                    return setBlockAttribute(undefined, 'style', {
                        overlay: args.overlay
                    });

                // Positioning
                case 'set_image_position':
                    return setBlockAttribute(undefined, 'style', {
                        position: args.position
                    });

                // Spacing
                case 'set_image_spacing':
                    return setBlockAttribute(undefined, 'style', {
                        spacing: args.spacing
                    });

                // Generic tools
                case 'get_block_attributes':
                    return getBlockAttributes(args.blockId);

                case 'set_block_attribute':
                    return setBlockAttribute(undefined, args.attributeName, args.attributeValue);

                case 'modify_current_block':
                    return modifyCurrentBlock(args.attributes, args.partialUpdate);

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