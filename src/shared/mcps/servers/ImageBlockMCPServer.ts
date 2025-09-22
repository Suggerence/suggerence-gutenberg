import { SuggerenceMCPServerConnection, SuggerenceMCPResponseTool } from '../types';
import {
    setBlockAttributeTool,
    getBlockAttributesTool,
    setImageAltTool,
    setImageSizeTool,
    setBlockAttribute,
    getBlockAttributes,
    setImageAlt,
    setImageSize
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
        setImageAltTool,
        setImageSizeTool,
        {
            name: 'set_image_link',
            description: 'Set link URL for image block',
            inputSchema: {
                type: 'object',
                properties: {
                    url: {
                        type: 'string',
                        description: 'URL to link to (empty string to remove link)'
                    },
                    linkTarget: {
                        type: 'string',
                        enum: ['_blank', '_self'],
                        description: 'Link target (optional)'
                    }
                },
                required: ['url']
            }
        },
        {
            name: 'set_image_caption',
            description: 'Set caption for image block',
            inputSchema: {
                type: 'object',
                properties: {
                    caption: {
                        type: 'string',
                        description: 'Caption text for the image'
                    }
                },
                required: ['caption']
            }
        },
        {
            name: 'set_image_size_slug',
            description: 'Set predefined image size',
            inputSchema: {
                type: 'object',
                properties: {
                    sizeSlug: {
                        type: 'string',
                        enum: ['thumbnail', 'medium', 'large', 'full'],
                        description: 'Predefined image size'
                    }
                },
                required: ['sizeSlug']
            }
        },
        {
            name: 'set_image_border_radius',
            description: 'Set border radius for image',
            inputSchema: {
                type: 'object',
                properties: {
                    borderRadius: {
                        type: 'string',
                        description: 'Border radius (e.g., "10px", "50%")'
                    }
                },
                required: ['borderRadius']
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
                case 'set_image_alt':
                    return setImageAlt(undefined, args.altText);

                case 'set_image_size':
                    return setImageSize(undefined, args.width, args.height);

                case 'set_image_link':
                    return setBlockAttribute(undefined, 'href', args.url);

                case 'set_image_caption':
                    return setBlockAttribute(undefined, 'caption', args.caption);

                case 'set_image_size_slug':
                    return setBlockAttribute(undefined, 'sizeSlug', args.sizeSlug);

                case 'set_image_border_radius':
                    return setBlockAttribute(undefined, 'style', {
                        border: { radius: args.borderRadius }
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