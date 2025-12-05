import { select, dispatch } from '@wordpress/data';
import { createBlock } from '@wordpress/blocks';
import { generateDynamicBlockTool, generateBlockCapabilityDescription } from '@/shared/utils/dynamic-block-tool-generator';
import {
    generateImageTool, generateEditedImageTool,
    generateImage, generateEditedImage
} from '@/shared/mcps/tools/image-generation';

export class GenericBlockMCPServer {
    static initialize(): SuggerenceMCPServerConnection {
        return {
            name: 'generic-block',
            title: 'Universal Block Tools',
            description: 'MCP server for any block type with full WordPress API access',
            protocol_version: '1.0.0',
            endpoint_url: 'http://localhost:3005',
            is_active: true,
            type: 'frontend',
            connected: true,
            client: new GenericBlockMCPServer(),
            id: 5,
            capabilities: '',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        }
    }

    private getDynamicTools(): SuggerenceMCPResponseTool[] {
        // Get current block and generate dynamic tool
        const { getSelectedBlockClientId, getBlock } = select('core/block-editor') as any;
        const currentBlockId = getSelectedBlockClientId();

        const tools: SuggerenceMCPResponseTool[] = [];

        if (currentBlockId) {
            const block = getBlock(currentBlockId);
            if (block) {
                const dynamicTool = generateDynamicBlockTool(block.name);
                if (dynamicTool) {
                    tools.push(dynamicTool);
                }

                // Add image tools for image-related blocks
                if (this.isImageBlock(block.name)) {
                    tools.push(generateImageTool, generateEditedImageTool);
                }
            }
        }

        return tools;
    }

    private isImageBlock(blockName: string): boolean {
        const imageBlocks = [
            'core/image',
            'core/gallery',
            'core/media-text',
            'core/cover'
        ];
        return imageBlocks.includes(blockName);
    }

    listTools(): { tools: SuggerenceMCPResponseTool[] } {
        return {
            tools: this.getDynamicTools()
        };
    }

    async callTool(params: { name: string, arguments: Record<string, any> }): Promise<{ content: Array<{ type: string, text: string }> }> {
        const { name, arguments: args } = params;

        try {
            switch (name) {
                case 'generate_image':
                    return generateImage(args.prompt, args.alt_text, args.input_images);

                case 'generate_edited_image':
                    return generateEditedImage(args.prompt, args.image_url, args.alt_text);

                default:
                    // Check if it's a dynamically generated tool
                    if (name.startsWith('modify_')) {
                        return this.handleDynamicTool(name, args);
                    }
                    return {
                        content: [{
                            type: 'text',
                            text: JSON.stringify({
                                success: false,
                                action: 'unknown_tool',
                                error: `Unknown tool: ${name}`
                            })
                        }]
                    };
            }
        } catch (error) {
            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify({
                        success: false,
                        action: `${name}_execution_failed`,
                        error: `Error executing ${name}: ${error instanceof Error ? error.message : 'Unknown error'}`
                    })
                }]
            };
        }
    }

    private modifyBlock(args: {
        blockId?: string;
        attributes?: Record<string, any>;
        style?: Record<string, any>;
    }): { content: Array<{ type: string, text: string }> } {
        const { getSelectedBlockClientId, getBlock } = select('core/block-editor') as any;
        const { updateBlockAttributes } = dispatch('core/block-editor') as any;

        const targetBlockId = args.blockId || getSelectedBlockClientId();

        if (!targetBlockId) {
            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify({
                        success: false,
                        action: 'block_not_found',
                        error: 'No block selected or specified'
                    })
                }]
            };
        }

        const currentBlock = getBlock(targetBlockId);
        if (!currentBlock) {
            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify({
                        success: false,
                        action: 'block_not_found',
                        error: `Block with ID ${targetBlockId} not found`
                    })
                }]
            };
        }

        // Build attributes object to update
        const updateAttributes: Record<string, any> = {};

        // Add regular attributes (but extract any style that was mistakenly put here)
        if (args.attributes) {
            const { style: attributeStyle, ...otherAttributes } = args.attributes;
            Object.assign(updateAttributes, otherAttributes);

            // If style was mistakenly put in attributes, merge it with the proper style
            if (attributeStyle) {
                console.warn('Style found in attributes - moving to proper style object');
                const currentStyle = currentBlock.attributes.style || {};
                const combinedStyle = this.deepMergeStyles(currentStyle, attributeStyle);
                updateAttributes.style = args.style ?
                    this.deepMergeStyles(combinedStyle, args.style) :
                    combinedStyle;
            }
        }

        // Handle style object (WordPress way) - deep merge to preserve existing styles
        if (args.style && !updateAttributes.style) {
            const currentStyle = currentBlock.attributes.style || {};
            updateAttributes.style = this.deepMergeStyles(currentStyle, args.style);
        }

        // Apply updates using WordPress API
        updateBlockAttributes(targetBlockId, updateAttributes);

        const changedProps = [
            ...(args.attributes ? Object.keys(args.attributes) : []),
            ...(args.style ? ['style'] : [])
        ];

        return {
            content: [{
                type: 'text',
                text: JSON.stringify({
                    success: true,
                    action: 'block_updated',
                    data: {
                        block_name: currentBlock.name,
                        changed_props: changedProps
                    }
                })
            }]
        };
    }

    private handleDynamicTool(toolName: string, args: any): { content: Array<{ type: string, text: string }> } {
        // Extract block name from tool name (modify_core_image -> core/image)
        const blockName = toolName.replace('modify_', '').replace(/_/g, '/');

        // Use the enhanced modify block with the provided arguments
        return this.modifyBlock({
            blockId: args.blockId,
            ...args
        });
    }

    private deepMergeStyles(currentStyle: any, newStyle: any): any {
        const merged = { ...currentStyle };

        Object.keys(newStyle).forEach(key => {
            if (newStyle[key] && typeof newStyle[key] === 'object' && !Array.isArray(newStyle[key])) {
                // Deep merge for nested objects like color, typography, spacing, border
                merged[key] = {
                    ...merged[key],
                    ...newStyle[key]
                };
            } else {
                // Direct assignment for primitive values and arrays
                merged[key] = newStyle[key];
            }
        });

        return merged;
    }
}