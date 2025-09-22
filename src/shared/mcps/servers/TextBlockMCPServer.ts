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
        setTextColorTool,
        setBackgroundColorTool,
        {
            name: 'set_font_size',
            description: 'Set font size for text blocks',
            inputSchema: {
                type: 'object',
                properties: {
                    fontSize: {
                        type: 'string',
                        description: 'Font size (e.g., "16px", "1.2em", "large")'
                    }
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
                    alignment: {
                        type: 'string',
                        enum: ['left', 'center', 'right', 'justify'],
                        description: 'Text alignment'
                    }
                },
                required: ['alignment']
            }
        },
        {
            name: 'toggle_bold',
            description: 'Toggle bold formatting for selected text in text blocks',
            inputSchema: {
                type: 'object',
                properties: {}
            }
        },
        {
            name: 'toggle_italic',
            description: 'Toggle italic formatting for selected text in text blocks',
            inputSchema: {
                type: 'object',
                properties: {}
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
                case 'set_text_color':
                    return setTextColor(undefined, args.color);

                case 'set_background_color':
                    return setBackgroundColor(undefined, args.color);

                case 'set_font_size':
                    return setBlockAttribute(undefined, 'fontSize', args.fontSize);

                case 'set_text_alignment':
                    return setBlockAttribute(undefined, 'align', args.alignment);

                case 'toggle_bold':
                    // This would need special handling for rich text formatting
                    return {
                        content: [{
                            type: 'text',
                            text: 'Bold toggle functionality not yet implemented'
                        }]
                    };

                case 'toggle_italic':
                    // This would need special handling for rich text formatting
                    return {
                        content: [{
                            type: 'text',
                            text: 'Italic toggle functionality not yet implemented'
                        }]
                    };

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