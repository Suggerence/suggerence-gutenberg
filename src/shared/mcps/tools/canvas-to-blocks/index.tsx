import { dispatch, select } from '@wordpress/data';
import { createBlock, getBlockTypes } from '@wordpress/blocks';

function getAvailableBlockTypes(): string[] {
    try {
        const blockTypes = getBlockTypes();
        return blockTypes
            .map(blockType => blockType.name)
            .filter(name => name.startsWith('core/')) // Focus on core blocks for canvas-to-blocks
            .sort();
    } catch (error) {
        console.warn('Could not get block types dynamically, using fallback list:', error);
        // Fallback list of common core blocks
        return [
            'core/audio',
            'core/button',
            'core/buttons',
            'core/code',
            'core/column',
            'core/columns',
            'core/cover',
            'core/embed',
            'core/gallery',
            'core/group',
            'core/heading',
            'core/html',
            'core/image',
            'core/list',
            'core/media-text',
            'core/paragraph',
            'core/preformatted',
            'core/pullquote',
            'core/quote',
            'core/separator',
            'core/spacer',
            'core/table',
            'core/verse',
            'core/video'
        ];
    }
}

function createGenerateBlocksFromCanvasTool(): SuggerenceMCPResponseTool {
    const availableBlockTypes = getAvailableBlockTypes();

    return {
    name: 'generate_blocks_from_canvas',
    description: 'Analyze a canvas drawing/sketch and generate corresponding Gutenberg block structure. CRITICAL: Provide complete, structured block definitions with proper content, attributes, and nested blocks.',
    inputSchema: {
        type: 'object',
        properties: {
            blockStructure: {
                oneOf: [
                    {
                        type: 'array',
                        description: 'Array of detailed block definitions based on canvas analysis. Each block must include proper blockType, content/attributes, and nested structures.',
                        items: {
                            type: 'object',
                            properties: {
                                blockType: {
                                    type: 'string',
                                    enum: availableBlockTypes,
                                    description: `WordPress block type from available blocks: ${availableBlockTypes.join(', ')}`
                                },
                                attributes: {
                                    type: 'object',
                                    description: 'Complete block attributes object. EXAMPLES: {"content": "text here", "level": 2} for headings, {"content": "paragraph text"} for paragraphs, {"text": "Click me", "url": "#"} for buttons, {"values": "<li>item</li>"} for lists',
                                    additionalProperties: true
                                },
                                innerBlocks: {
                                    type: 'array',
                                    description: 'Array of nested block objects for containers (columns, groups). Each inner block follows same structure with blockType, attributes, innerBlocks',
                                    items: {
                                        type: 'object',
                                        properties: {
                                            blockType: { type: 'string' },
                                            attributes: { type: 'object', additionalProperties: true },
                                            innerBlocks: { type: 'array' }
                                        },
                                        required: ['blockType']
                                    }
                                }
                            },
                            required: ['blockType']
                        }
                    },
                    {
                        type: 'string',
                        description: 'JSON string representation of the block structure array (fallback for serialization issues)'
                    }
                ]
            },
            analysis: {
                type: 'string',
                description: 'Brief description of what you see in the drawing and how you interpreted it into blocks'
            },
            replaceExisting: {
                type: 'boolean',
                description: 'Whether to replace all existing blocks or append to current content',
                default: false
            },
            targetPosition: {
                type: 'number',
                description: 'Position where to insert the generated blocks (0-based index). If not provided, appends to end'
            }
        },
        required: ['blockStructure', 'analysis']
    }
    };
}

export const generateBlocksFromCanvasTool = createGenerateBlocksFromCanvasTool();

interface BlockDefinition {
    blockType: string;
    attributes?: Record<string, any>;
    innerBlocks?: BlockDefinition[];
}

export function generateBlocksFromCanvas(
    blockStructure: BlockDefinition[] | string,
    analysis: string,
    replaceExisting: boolean = false,
    targetPosition?: number
): { content: Array<{ type: string, text: string }> } {

    // Parse blockStructure if it's a JSON string
    let parsedBlockStructure: BlockDefinition[];
    try {
        if (typeof blockStructure === 'string') {
            const parsed = JSON.parse(blockStructure);
            // Handle case where AI wraps the array in an object with a "blocks" key
            if (parsed && typeof parsed === 'object' && Array.isArray(parsed.blocks)) {
                parsedBlockStructure = parsed.blocks;
            } else if (Array.isArray(parsed)) {
                parsedBlockStructure = parsed;
            } else {
                throw new Error('Parsed JSON is not an array or does not contain a blocks array');
            }
        } else {
            parsedBlockStructure = blockStructure;
        }
    } catch (parseError) {
        return {
            content: [{
                type: 'text',
                text: JSON.stringify({
                    success: false,
                    action: 'canvas_to_blocks_failed',
                    error: `Invalid blockStructure format: ${parseError instanceof Error ? parseError.message : 'Could not parse JSON'}. Please provide valid JSON array format or object with "blocks" array.`
                })
            }]
        };
    }

    if (!parsedBlockStructure || !Array.isArray(parsedBlockStructure) || parsedBlockStructure.length === 0) {
        return {
            content: [{
                type: 'text',
                text: JSON.stringify({
                    success: false,
                    action: 'canvas_to_blocks_failed',
                    error: 'No block structure provided or invalid format. Please analyze the canvas drawing and provide a detailed block structure array with proper attributes and content.'
                })
            }]
        };
    }

    const { insertBlocks, replaceBlocks } = dispatch('core/block-editor') as any;

    try {
        // Validate and convert block definitions to actual Gutenberg blocks
        const blocks = parsedBlockStructure.map((blockDef, index) => {
            const block = createBlockFromDefinition(blockDef);
            if (!block) {
                console.warn(`Failed to create block ${index}:`, blockDef);
            }
            return block;
        }).filter(Boolean);

        if (blocks.length === 0) {
            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify({
                        success: false,
                        action: 'canvas_to_blocks_failed',
                        error: 'Could not create any valid blocks from the provided structure. Make sure to provide proper blockType (e.g., "core/heading", "core/paragraph") and attributes.'
                    })
                }]
            };
        }

        if (replaceExisting) {
            // Replace all existing blocks
            replaceBlocks([], blocks);
        } else {
            // Insert at specified position or append to end
            const index = targetPosition !== undefined ? targetPosition : undefined;
            insertBlocks(blocks, index);
        }

        const blockDetails = blocks.map(block => ({
            type: block.name,
            id: block.clientId
        }));

        return {
            content: [{
                type: 'text',
                text: JSON.stringify({
                    success: true,
                    action: replaceExisting ? 'blocks_replaced' : 'blocks_generated',
                    data: {
                        analysis: analysis,
                        blocks_count: blocks.length,
                        blocks: blockDetails,
                        replaced_existing: replaceExisting
                    }
                })
            }]
        };

    } catch (error) {
        return {
            content: [{
                type: 'text',
                text: JSON.stringify({
                    success: false,
                    action: 'canvas_to_blocks_failed',
                    error: `Error creating blocks from canvas: ${error instanceof Error ? error.message : 'Unknown error'}. Check the blockStructure format - ensure proper blockType and attributes.`
                })
            }]
        };
    }
}

function createBlockFromDefinition(blockDef: BlockDefinition): any {
    try {
        const { blockType, attributes = {}, innerBlocks = [] } = blockDef;

        // Handle nested blocks recursively
        const childBlocks = innerBlocks.length > 0
            ? innerBlocks.map(innerBlock => createBlockFromDefinition(innerBlock)).filter(Boolean)
            : [];

        // Create the block with attributes and inner blocks
        return createBlock(blockType, attributes, childBlocks);

    } catch (error) {
        console.warn('Failed to create block from definition:', blockDef, error);
        return null;
    }
}