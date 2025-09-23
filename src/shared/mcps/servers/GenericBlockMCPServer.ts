import { SuggerenceMCPServerConnection, SuggerenceMCPResponseTool } from '../types';
import { select, dispatch } from '@wordpress/data';
import { createBlock } from '@wordpress/blocks';
import { generateDynamicBlockTool, generateBlockCapabilityDescription } from '@/shared/utils/dynamic-block-tool-generator';

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
            }
        }

        // Always include the generic tools
        // tools.push(...this.getGenericTools());

        return tools;
    }

    private getGenericTools(): SuggerenceMCPResponseTool[] {
        return [
        {
            name: 'modify_block',
            description: 'Modify any block using WordPress core APIs. Supports all block types and any WordPress functionality.',
            inputSchema: {
                type: 'object',
                properties: {
                    blockId: {
                        type: 'string',
                        description: 'Block client ID (optional, uses selected block if not provided)'
                    },
                    attributes: {
                        type: 'object',
                        description: 'Block attributes to update (any WordPress block attribute)',
                        additionalProperties: true
                    },
                    // WordPress-specific style object for filters, spacing, etc.
                    style: {
                        type: 'object',
                        description: 'WordPress style object for colors, spacing, borders, typography',
                        properties: {
                            color: {
                                type: 'object',
                                description: 'Color-related styles including duotone filters',
                                properties: {
                                    duotone: {
                                        type: 'array',
                                        description: 'Duotone filter colors [highlightColor, shadowColor]',
                                        items: { type: 'string' },
                                        minItems: 2,
                                        maxItems: 2
                                    }
                                }
                            },
                            spacing: {
                                type: 'object',
                                description: 'Spacing (padding, margin)',
                                additionalProperties: true
                            },
                            border: {
                                type: 'object',
                                description: 'Border styles',
                                additionalProperties: true
                            },
                            typography: {
                                type: 'object',
                                description: 'Typography styles',
                                additionalProperties: true
                            }
                        }
                    },
                    // Direct WordPress API calls
                    transformTo: {
                        type: 'string',
                        description: 'Transform block to different type (e.g., "core/cover")'
                    },
                    wrapIn: {
                        type: 'string',
                        description: 'Wrap block in a container block type'
                    }
                }
            }
        },
        {
            name: 'get_block_info',
            description: 'Get complete information about a block including attributes, supports, and available actions',
            inputSchema: {
                type: 'object',
                properties: {
                    blockId: {
                        type: 'string',
                        description: 'Block client ID (optional, uses selected block if not provided)'
                    }
                }
            }
        },
        {
            name: 'get_block_capabilities',
            description: 'Get comprehensive capabilities of the current block based on its block.json schema and supports',
            inputSchema: {
                type: 'object',
                properties: {
                    blockId: {
                        type: 'string',
                        description: 'Block client ID (optional, uses selected block if not provided)'
                    }
                }
            }
        },
        {
            name: 'apply_duotone_filter',
            description: 'Apply WordPress duotone filter to blocks that support it (images, covers, etc.). Uses WordPress standard style.color.duotone format.',
            inputSchema: {
                type: 'object',
                properties: {
                    blockId: {
                        type: 'string',
                        description: 'Block client ID (optional, uses selected block if not provided)'
                    },
                    colors: {
                        type: 'array',
                        description: 'Two colors for duotone effect [highlightColor, shadowColor] - hex codes like ["#ffffff", "#000000"]',
                        items: { type: 'string' },
                        minItems: 2,
                        maxItems: 2
                    }
                },
                required: ['colors']
            }
        }
        ];
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
                case 'modify_block':
                    return this.modifyBlock(args);

                case 'get_block_info':
                    return this.getBlockInfo(args.blockId);

                case 'get_block_capabilities':
                    return this.getBlockCapabilities(args.blockId);

                case 'apply_duotone_filter':
                    return this.applyDuotoneFilter(args.blockId, args.colors);

                default:
                    // Check if it's a dynamically generated tool
                    if (name.startsWith('modify_')) {
                        return this.handleDynamicTool(name, args);
                    }
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

    private modifyBlock(args: {
        blockId?: string;
        attributes?: Record<string, any>;
        style?: Record<string, any>;
        transformTo?: string;
        wrapIn?: string;
    }): { content: Array<{ type: string, text: string }> } {
        const { getSelectedBlockClientId, getBlock } = select('core/block-editor') as any;
        const { updateBlockAttributes, replaceBlock } = dispatch('core/block-editor') as any;

        const targetBlockId = args.blockId || getSelectedBlockClientId();

        if (!targetBlockId) {
            return {
                content: [{
                    type: 'text',
                    text: 'No block selected or specified'
                }]
            };
        }

        const currentBlock = getBlock(targetBlockId);
        if (!currentBlock) {
            return {
                content: [{
                    type: 'text',
                    text: `Block with ID ${targetBlockId} not found`
                }]
            };
        }

        // Handle transformations
        if (args.transformTo) {
            const newBlock = createBlock(args.transformTo, {
                ...currentBlock.attributes,
                ...(args.attributes || {})
            }, currentBlock.innerBlocks);

            replaceBlock(targetBlockId, newBlock);

            return {
                content: [{
                    type: 'text',
                    text: `Transformed block from ${currentBlock.name} to ${args.transformTo}`
                }]
            };
        }

        if (args.wrapIn) {
            const wrapperBlock = createBlock(args.wrapIn, {}, [currentBlock]);
            replaceBlock(targetBlockId, wrapperBlock);

            return {
                content: [{
                    type: 'text',
                    text: `Wrapped ${currentBlock.name} in ${args.wrapIn}`
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
                text: `Updated ${currentBlock.name} block. Changed: ${changedProps.join(', ')}`
            }]
        };
    }

    private getBlockInfo(blockId?: string): { content: Array<{ type: string, text: string }> } {
        const { getSelectedBlockClientId, getBlock } = select('core/block-editor') as any;
        const { getBlockType } = select('core/blocks') as any;

        const targetBlockId = blockId || getSelectedBlockClientId();

        if (!targetBlockId) {
            return {
                content: [{
                    type: 'text',
                    text: 'No block selected or specified'
                }]
            };
        }

        const block = getBlock(targetBlockId);
        if (!block) {
            return {
                content: [{
                    type: 'text',
                    text: `Block with ID ${targetBlockId} not found`
                }]
            };
        }

        const blockType = getBlockType(block.name);

        const info = {
            clientId: targetBlockId,
            name: block.name,
            title: blockType?.title || 'Unknown',
            attributes: block.attributes,
            supports: blockType?.supports || {},
            innerBlocks: block.innerBlocks?.map((ib: any) => ({
                name: ib.name,
                clientId: ib.clientId
            })) || []
        };

        return {
            content: [{
                type: 'text',
                text: JSON.stringify(info, null, 2)
            }]
        };
    }

    private getBlockCapabilities(blockId?: string): { content: Array<{ type: string, text: string }> } {
        const { getSelectedBlockClientId, getBlock } = select('core/block-editor') as any;

        const targetBlockId = blockId || getSelectedBlockClientId();

        if (!targetBlockId) {
            return {
                content: [{
                    type: 'text',
                    text: 'No block selected or specified'
                }]
            };
        }

        const block = getBlock(targetBlockId);
        if (!block) {
            return {
                content: [{
                    type: 'text',
                    text: `Block with ID ${targetBlockId} not found`
                }]
            };
        }

        const capabilities = generateBlockCapabilityDescription(block.name);

        return {
            content: [{
                type: 'text',
                text: capabilities
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

    private applyDuotoneFilter(blockId: string | undefined, colors: string[]): { content: Array<{ type: string, text: string }> } {
        if (colors.length !== 2) {
            return {
                content: [{
                    type: 'text',
                    text: 'Duotone filter requires exactly 2 colors: [highlightColor, shadowColor]'
                }]
            };
        }

        // Use proper WordPress duotone format: style.color.duotone
        return this.modifyBlock({
            blockId,
            style: {
                color: {
                    duotone: colors
                }
            }
        });
    }
}