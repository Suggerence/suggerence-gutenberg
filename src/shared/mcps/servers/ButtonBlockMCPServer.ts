import {
    setBlockAttributeTool,
    getBlockAttributesTool,
    setTextColorTool,
    setBackgroundColorTool,
    setBlockAttribute,
    getBlockAttributes,
    setTextColor,
    setBackgroundColor
} from '@/shared/mcps/tools/block-attributes';

export class ButtonBlockMCPServer {
    static initialize(): SuggerenceMCPServerConnection {
        return {
            name: 'button-block',
            title: 'Button Block Tools',
            description: 'MCP server for button blocks',
            protocol_version: '1.0.0',
            endpoint_url: 'http://localhost:3003',
            is_active: true,
            type: 'frontend',
            connected: true,
            client: new ButtonBlockMCPServer(),
            id: 4,
            capabilities: '',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        }
    }

    private tools: SuggerenceMCPResponseTool[] = [
        {
            name: 'set_button_text',
            description: 'Set button text content',
            inputSchema: {
                type: 'object',
                properties: {
                    text: {
                        type: 'string',
                        description: 'Button text content'
                    }
                },
                required: ['text']
            }
        },
        {
            name: 'set_button_url',
            description: 'Set button link URL',
            inputSchema: {
                type: 'object',
                properties: {
                    url: {
                        type: 'string',
                        description: 'URL for the button link'
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
        setTextColorTool,
        setBackgroundColorTool,
        {
            name: 'set_button_border_radius',
            description: 'Set button border radius',
            inputSchema: {
                type: 'object',
                properties: {
                    borderRadius: {
                        type: 'string',
                        description: 'Border radius (e.g., "5px", "10px", "50%")'
                    }
                },
                required: ['borderRadius']
            }
        },
        {
            name: 'set_button_padding',
            description: 'Set button padding',
            inputSchema: {
                type: 'object',
                properties: {
                    padding: {
                        type: 'string',
                        description: 'Padding value (e.g., "10px", "5px 10px")'
                    }
                },
                required: ['padding']
            }
        },
        {
            name: 'set_button_gradient',
            description: 'Set button gradient background',
            inputSchema: {
                type: 'object',
                properties: {
                    gradient: {
                        type: 'string',
                        description: 'CSS gradient value'
                    }
                },
                required: ['gradient']
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
                case 'set_button_text':
                    return setBlockAttribute(undefined, 'text', args.text);

                case 'set_button_url':
                    const updates: any = { url: args.url };
                    if (args.linkTarget) {
                        updates.linkTarget = args.linkTarget;
                    }
                    // For buttons, we need to update multiple attributes
                    return setBlockAttribute(undefined, 'url', args.url);

                case 'set_text_color':
                    return setTextColor(undefined, args.color);

                case 'set_background_color':
                    return setBackgroundColor(undefined, args.color);

                case 'set_button_border_radius':
                    return setBlockAttribute(undefined, 'borderRadius', args.borderRadius);

                case 'set_button_padding':
                    return setBlockAttribute(undefined, 'style', {
                        spacing: { padding: args.padding }
                    });

                case 'set_button_gradient':
                    return setBlockAttribute(undefined, 'gradient', args.gradient);

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