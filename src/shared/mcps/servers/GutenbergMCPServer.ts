import {
    addBlockTool,
    moveBlockTool,
    duplicateBlockTool,
    deleteBlockTool,
    selectBlockTool,
    updateBlockContentTool,
    addBlock,
    moveBlock,
    duplicateBlock,
    deleteBlock,
    selectBlock,
    updateBlockContent,
} from '@/shared/mcps/tools/block-manipulation';
import {
    getBlocksInfoTool,
    getSelectedBlockInfoTool,
    getBlocksInfo,
    getSelectedBlockInfo
} from '@/shared/mcps/tools/block-info';
import {
    generateImageTool,
    generateImageWithInputsTool,
    generateEditedImageTool,
    generateImage,
    generateImageWithInputs,
    generateEditedImage
} from '@/shared/mcps/tools/image-generation';
import {
    generateBlocksFromCanvasTool,
    generateBlocksFromCanvas
} from '@/shared/mcps/tools/canvas-to-blocks';
import {
    getAvailableBlocksTool,
    getBlockSchemaTool,
    getAvailableBlocks,
    getBlockSchema
} from '@/shared/mcps/tools/block-schema';
import { generateBlockCapabilityDescription } from '@/shared/utils/dynamic-block-tool-generator';

import { select, dispatch } from '@wordpress/data';
import { createBlock } from '@wordpress/blocks';


export class GutenbergMCPServer {
    static initialize(): SuggerenceMCPServerConnection {
        return {
            name: 'gutenberg',
            title: 'Gutenberg Editor',
            description: 'Frontend MCP server for Gutenberg block editor operations',
            protocol_version: '1.0.0',
            endpoint_url: 'http://localhost:3000',
            is_active: true,
            type: 'frontend',
            connected: true,
            client: new GutenbergMCPServer(),
            id: 1,
            capabilities: '',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        }
    }

    private tools: SuggerenceMCPResponseTool[] = [
        addBlockTool,
        moveBlockTool,
        duplicateBlockTool,
        deleteBlockTool,
        // selectBlockTool,
        // updateBlockContentTool,
        {
            name: 'update_block',
            description: 'Update any block using WordPress core APIs. Supports all block types and any WordPress functionality including attributes, styles, transforms.',
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
                    style: {
                        type: 'object',
                        description: 'WordPress style object for colors, spacing, borders, typography',
                        additionalProperties: true
                    },
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
        generateImageTool,
        generateImageWithInputsTool,
        generateEditedImageTool,
        // getBlocksInfoTool,
        getSelectedBlockInfoTool,
        generateBlocksFromCanvasTool,
        getAvailableBlocksTool,
        getBlockSchemaTool
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
                case 'add_block':
                    return addBlock(args.blockType, args.attributes, args.position, args.targetBlockId);

                case 'move_block':
                    return moveBlock(args.position, args.blockId);

                case 'duplicate_block':
                    return duplicateBlock(args.blockId);

                case 'delete_block':
                    return deleteBlock(args.blockId);

                case 'generate_image':
                    return generateImage(args.prompt, args.alt_text);

                case 'generate_image_with_inputs':
                    return generateImageWithInputs(args.prompt, args.input_images, args.alt_text);

                case 'generate_edited_image':
                    return generateEditedImage(args.prompt, args.image_url, args.alt_text);

                case 'select_block':
                    return selectBlock(args.blockId);

                case 'update_block_content':
                    return updateBlockContent(args.blockId, args.content);

                case 'update_block':
                    return this.modifyBlock(args);

                case 'get_blocks_info':
                    return getBlocksInfo(args.includeContent);

                case 'get_selected_block_info':
                    return getSelectedBlockInfo();

                case 'generate_blocks_from_canvas':
                    return generateBlocksFromCanvas(args.blockStructure, args.analysis, args.replaceExisting, args.targetPosition);

                case 'get_available_blocks':
                    return getAvailableBlocks(args.includeInactive, args.category);

                case 'get_block_schema':
                    return getBlockSchema(args.blockType);

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

    private modifyBlock(args: {
        blockId?: string;
        attributes?: Record<string, any>;
        style?: Record<string, any>;
        transformTo?: string;
        wrapIn?: string;
        content?: string;
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

        // Handle simple content update (backwards compatibility)
        if (args.content && !args.attributes && !args.style) {
            return updateBlockContent(targetBlockId, args.content);
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
            ...(args.style ? ['style'] : []),
            ...(args.content ? ['content'] : [])
        ];

        return {
            content: [{
                type: 'text',
                text: `Updated ${currentBlock.name} block. Changed: ${changedProps.join(', ')}`
            }]
        };
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