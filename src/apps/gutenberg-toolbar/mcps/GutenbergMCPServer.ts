import { dispatch, select } from '@wordpress/data';
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
        {
            name: 'add_block',
            description: 'Add any type of block to the editor',
            inputSchema: {
                type: 'object',
                properties: {
                    blockType: {
                        type: 'string',
                        description: 'The block type to create. Common types: core/paragraph, core/heading, core/image, core/list, core/code, core/button, core/group, core/columns, core/cover, core/gallery, core/audio, core/video, core/embed, core/spacer, core/separator, core/quote, core/table, core/html, core/shortcode'
                    },
                    attributes: {
                        type: 'object',
                        description: 'Block attributes (optional, depends on block type)',
                        additionalProperties: true
                    },
                    position: {
                        type: 'string',
                        description: 'Where to insert the block relative to selected block (before, after, or end)',
                        enum: ['before', 'after', 'end']
                    },
                    targetBlockId: {
                        type: 'string',
                        description: 'ID of block to insert relative to (optional, uses selected block if not provided)'
                    }
                },
                required: ['blockType']
            }
        },
        {
            name: 'move_block',
            description: 'Move a block to any position in the editor',
            inputSchema: {
                type: 'object',
                properties: {
                    position: {
                        type: 'number',
                        description: 'The target position (0-based index) where to move the block'
                    },
                    blockId: {
                        type: 'string',
                        description: 'The client ID of the block to move (optional, uses selected block if not provided)'
                    }
                },
                required: ['position']
            }
        },
        {
            name: 'duplicate_block',
            description: 'Duplicate a block in the editor',
            inputSchema: {
                type: 'object',
                properties: {
                    blockId: {
                        type: 'string',
                        description: 'The client ID of the block to duplicate (optional, uses selected block if not provided)'
                    }
                }
            }
        },
        {
            name: 'delete_block',
            description: 'Delete a block from the editor',
            inputSchema: {
                type: 'object',
                properties: {
                    blockId: {
                        type: 'string',
                        description: 'The client ID of the block to delete (optional, uses selected block if not provided)'
                    }
                }
            }
        },
        {
            name: 'add_generated_image',
            description: 'Generate and add an image to the editor using nano banana',
            inputSchema: {
                type: 'object',
                properties: {
                    prompt: {
                        type: 'string',
                        description: 'The text prompt describing the image to generate'
                    },
                    position: {
                        type: 'string',
                        description: 'Where to insert the image relative to selected block (before, after, or end)',
                         enum: ['before', 'after', 'end']
                    },
                    alt_text: {
                        type: 'string',
                        description: 'Alternative text for the image (optional, will use prompt if not provided)'
                    }
                },
                required: ['prompt']
            }
        },
        {
            name: 'select_block',
            description: 'Select a specific block in the editor by its client ID',
            inputSchema: {
                type: 'object',
                properties: {
                    blockId: {
                        type: 'string',
                        description: 'The client ID of the block to select'
                    }
                },
                required: ['blockId']
            }
        },
        {
            name: 'update_block_content',
            description: 'Update the content of an existing block',
            inputSchema: {
                type: 'object',
                properties: {
                    blockId: {
                        type: 'string',
                        description: 'The client ID of the block to update (optional, uses selected block if not provided)'
                    },
                    content: {
                        type: 'string',
                        description: 'The new content for the block'
                    }
                },
                required: ['content']
            }
        },
        {
            name: 'get_blocks_info',
            description: 'Get detailed information about all blocks in the editor with their IDs',
            inputSchema: {
                type: 'object',
                properties: {
                    includeContent: {
                        type: 'boolean',
                        description: 'Whether to include block content in the response (default: false)'
                    }
                }
            }
        }
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
                    return this.addBlock(args.blockType, args.attributes, args.position, args.targetBlockId);

                case 'move_block':
                    return this.moveBlock(args.position, args.blockId);

                case 'duplicate_block':
                    return this.duplicateBlock(args.blockId);

                case 'delete_block':
                    return this.deleteBlock(args.blockId);

                case 'add_generated_image':
                    return this.addGeneratedImage(args.prompt, args.position, args.alt_text);

                case 'select_block':
                    return this.selectBlock(args.blockId);

                case 'update_block_content':
                    return this.updateBlockContent(args.blockId, args.content);

                case 'get_blocks_info':
                    return this.getBlocksInfo(args.includeContent);

                case 'get_selected_block_info':
                    return this.getSelectedBlockInfo();

                case 'insert_block_after':
                    return this.insertBlockAfter(args.blockType, args.afterBlockId);

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

    private addBlock(blockType: string, attributes: Record<string, any> = {}, position: string = 'after', targetBlockId?: string): { content: Array<{ type: string, text: string }> } {
        const { insertBlock } = dispatch('core/block-editor') as any;
        const { getSelectedBlockClientId, getBlockIndex } = select('core/block-editor') as any;

        const newBlock = createBlock(blockType, attributes);
        const selectedBlockId = targetBlockId || getSelectedBlockClientId();

        let index: number | undefined;
        if (position.toLowerCase() === 'before' && selectedBlockId) {
            index = getBlockIndex(selectedBlockId);
        } else if (position.toLowerCase() === 'after' && selectedBlockId) {
            index = getBlockIndex(selectedBlockId) + 1;
        } else {
            index = undefined; // Insert at the end
        }

        insertBlock(newBlock, index);

        return {
            content: [{
                type: 'text',
                text: `Added ${blockType} block${attributes && Object.keys(attributes).length > 0 ? ` with attributes: ${JSON.stringify(attributes)}` : ''}`
            }]
        };
    }

    private moveBlock(position: number, blockId?: string): { content: Array<{ type: string, text: string }> } {
        const { removeBlocks, insertBlocks } = dispatch('core/block-editor') as any;
        const { getSelectedBlockClientId, getBlockIndex, getBlocks, getBlock } = select('core/block-editor') as any;

        const sourceBlockId = blockId || getSelectedBlockClientId();

        if (!sourceBlockId) {
            throw new Error('No block selected and no blockId provided');
        }

        const blocks = getBlocks();
        const currentIndex = getBlockIndex(sourceBlockId);
        const maxIndex = blocks.length - 1;
        const targetIndex = Math.max(0, Math.min(position, maxIndex));

        if (currentIndex === targetIndex) {
            return {
                content: [{
                    type: 'text',
                    text: `Block is already at position ${targetIndex}`
                }]
            };
        }

        // Get the block to move
        const blockToMove = getBlock(sourceBlockId);

        // Remove the block from its current position
        removeBlocks([sourceBlockId], false);

        // Insert the block at the new position
        // Adjust index if we're moving from before the target position
        const adjustedIndex = currentIndex < targetIndex ? targetIndex : targetIndex;
        insertBlocks([blockToMove], adjustedIndex);

        return {
            content: [{
                type: 'text',
                text: `Moved block from position ${currentIndex} to position ${targetIndex}`
            }]
        };
    }

    private duplicateBlock(blockId?: string): { content: Array<{ type: string, text: string }> } {
        const { duplicateBlocks } = dispatch('core/block-editor') as any;
        const { getSelectedBlockClientId } = select('core/block-editor') as any;

        const targetBlockId = blockId || getSelectedBlockClientId();

        if (!targetBlockId) {
            throw new Error('No block selected and no blockId provided');
        }

        duplicateBlocks([targetBlockId]);

        return {
            content: [{
                type: 'text',
                text: 'Duplicated block successfully'
            }]
        };
    }

    private deleteBlock(blockId?: string): { content: Array<{ type: string, text: string }> } {
        const { removeBlocks } = dispatch('core/block-editor') as any;
        const { getSelectedBlockClientId } = select('core/block-editor') as any;

        const targetBlockId = blockId || getSelectedBlockClientId();

        if (!targetBlockId) {
            throw new Error('No block selected and no blockId provided');
        }

        removeBlocks([targetBlockId]);

        return {
            content: [{
                type: 'text',
                text: 'Deleted block successfully'
            }]
        };
    }

    private selectBlock(blockId: string): { content: Array<{ type: string, text: string }> } {
        const { selectBlock } = dispatch('core/block-editor') as any;

        selectBlock(blockId);

        return {
            content: [{
                type: 'text',
                text: `Selected block ${blockId}`
            }]
        };
    }

    private updateBlockContent(blockId: string | undefined, content: string): { content: Array<{ type: string, text: string }> } {
        const { updateBlockAttributes } = dispatch('core/block-editor') as any;
        const { getSelectedBlockClientId } = select('core/block-editor') as any;

        const targetBlockId = blockId || getSelectedBlockClientId();

        if (!targetBlockId) {
            throw new Error('No block selected and no blockId provided');
        }

        updateBlockAttributes(targetBlockId, { content });

        return {
            content: [{
                type: 'text',
                text: `Updated block content: "${content}"`
            }]
        };
    }

    private getBlocksInfo(includeContent: boolean = false): { content: Array<{ type: string, text: string }> } {
        const { getBlocks } = select('core/block-editor') as any;

        const blocks = getBlocks();
        const blocksInfo = blocks.map((block: any) => ({
            id: block.clientId,
            name: block.name,
            ...(includeContent && {
                content: block.attributes.content || '',
                attributes: block.attributes
            })
        }));

        return {
            content: [{
                type: 'text',
                text: JSON.stringify(blocksInfo, null, 2)
            }]
        };
    }

    private getSelectedBlockInfo(): { content: Array<{ type: string, text: string }> } {
        const { getSelectedBlock } = select('core/block-editor') as any;

        const selectedBlock = getSelectedBlock();

        if (!selectedBlock) {
            return {
                content: [{
                    type: 'text',
                    text: 'No block is currently selected'
                }]
            };
        }

        const blockInfo = {
            id: selectedBlock.clientId,
            name: selectedBlock.name,
            content: selectedBlock.attributes.content || '',
            attributes: selectedBlock.attributes
        };

        return {
            content: [{
                type: 'text',
                text: JSON.stringify(blockInfo, null, 2)
            }]
        };
    }

    private insertBlockAfter(blockType: string, afterBlockId?: string): { content: Array<{ type: string, text: string }> } {
        const { insertBlock } = dispatch('core/block-editor') as any;
        const { getSelectedBlockClientId, getBlockIndex } = select('core/block-editor') as any;

        const targetBlockId = afterBlockId || getSelectedBlockClientId();

        if (!targetBlockId) {
            throw new Error('No block selected and no afterBlockId provided');
        }

        const newBlock = createBlock(blockType);
        const index = getBlockIndex(targetBlockId) + 1;

        insertBlock(newBlock, index);

        return {
            content: [{
                type: 'text',
                text: `Inserted ${blockType} block after selected block`
            }]
        };
    }

    private async addGeneratedImage(prompt: string, position: string = 'after', altText?: string): Promise<{ content: Array<{ type: string, text: string }> }> {
        try {
            // Generate image using nano banana API
            const imageResponse = await this.generateImageWithNanoBanana(prompt);
            
            if (!imageResponse.success) {
                throw new Error(imageResponse.error || 'Failed to generate image');
            }

            // Create image block with the generated image
            const { insertBlock } = dispatch('core/block-editor') as any;
            const { getSelectedBlockClientId, getBlockIndex } = select('core/block-editor') as any;

            const newBlock = createBlock('core/image', {
                url: imageResponse.image_url,
                alt: altText || prompt,
                caption: '',
                id: imageResponse.attachment_id
            });

            const selectedBlockId = getSelectedBlockClientId();

            let index: number | undefined;
            if (position.toLowerCase() === 'before' && selectedBlockId) {
                index = getBlockIndex(selectedBlockId);
            } else if (position.toLowerCase() === 'after' && selectedBlockId) {
                index = getBlockIndex(selectedBlockId) + 1;
            } else {
                index = undefined; // Insert at the end
            }

            insertBlock(newBlock, index);

            return {
                content: [{
                    type: 'text',
                    text: `Generated and added image with prompt: "${prompt}". Image URL: ${imageResponse.image_url}`
                }]
            };
        } catch (error) {
            throw new Error(`Failed to generate and add image: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    private async generateImageWithNanoBanana(prompt: string): Promise<{ success: boolean; image_url?: string; attachment_id?: number; error?: string }> {
        try {
            // Make API call to WordPress backend to generate image using Gemini with nano banana model
            const response = await fetch('/wp-json/suggerence-gutenberg/ai-providers/v1/providers/image', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-WP-Nonce': (window as any).wpApiSettings?.nonce || ''
                },
                body: JSON.stringify({
                    prompt: prompt,
                    provider: 'gemini',
                    model: 'gemini-2.5-flash-image-preview'
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error generating image with nano banana (Gemini):', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred'
            };
        }
    }
}