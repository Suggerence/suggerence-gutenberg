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
    description: `Converts a canvas drawing/sketch into actual WordPress blocks with real content. 

CRITICAL WORKFLOW - Follow this sequence:
1. ANALYZE the canvas: Look for text annotations, image labels, and layout structure
2. INTERPRET CONTENT INSTRUCTIONS: Distinguish between literal text and content prompts
3. GENERATE ASSETS FIRST: If you see image references, STOP and call image generation tool FIRST, then return here with the URLs
4. GENERATE OR EXTRACT TEXT: 
   - If text is a TITLE/LABEL (e.g., "Welcome", "Click Here", "About Us") → Use it verbatim
   - If text is a CONTENT PROMPT (e.g., "Text about whales", "Paragraph about services") → Generate appropriate real content on that topic
5. CREATE BLOCKS: Build the block structure with actual generated images and real text content

EXAMPLE WORKFLOWS:

Literal text (use verbatim):
- Canvas shows "Welcome to Our Site" → {"content": "Welcome to Our Site", "level": 1}
- Canvas shows "Click Here" button → {"text": "Click Here", "url": "#"}
- Canvas shows "About Us" → {"content": "About Us", "level": 2}

Content generation prompts (create real content):
- Canvas shows "Text about whales" → {"content": "Whales are magnificent marine mammals that inhabit oceans worldwide. These intelligent creatures communicate through complex songs and travel vast distances during their annual migrations..."}
- Canvas shows "Paragraph about our services" → {"content": "We offer comprehensive solutions tailored to meet your business needs. Our experienced team provides expert consultation, implementation, and ongoing support..."}
- Canvas shows "Description of product features" → Generate actual feature descriptions

Images (always generate):
- Canvas shows "Image of mountain sunset" → Call the image generation tool with "mountain sunset" → Response has data.image_id and data.image_url → Use {"id": data.image_id, "url": data.image_url, "alt": "mountain sunset", "sizeSlug": "large"}
- Canvas shows "Lion photo" → Use image generation tool for "lion photo" → Extract image_id from response → {"id": image_id, "url": image_url, "alt": "lion", "sizeSlug": "large"}
  
  CRITICAL IMAGE WORKFLOW:
  1. Use the image generation tool with the image description
  2. Response format: {"success": true, "action": "image_generated", "data": {"image_id": 123, "image_url": "https://..."}}
  3. Extract data.image_id and data.image_url from the JSON response
  4. Create image block: {"blockType": "core/image", "attributes": {"id": <image_id>, "url": <image_url>, "alt": "description", "sizeSlug": "large"}}

This tool creates the FINAL layout with real, production-ready content - never use placeholders or generic text.`,
    inputSchema: {
        type: 'object',
        properties: {
            blockStructure: {
                type: 'array',
                description: `Direct array of block objects - DO NOT wrap in extra objects or stringify. Each block must have blockType and should have attributes with real content.

CORRECT FORMAT:
[
  {"blockType": "core/heading", "attributes": {"content": "Welcome", "level": 1}},
  {"blockType": "core/paragraph", "attributes": {"content": "This is the actual text from canvas"}},
  {"blockType": "core/image", "attributes": {"id": 123, "url": "https://...", "alt": "Generated image", "sizeSlug": "large"}},
  {"blockType": "core/list", "attributes": {"ordered": false, "values": "<li>Item 1</li><li>Item 2</li>"}},
  {"blockType": "core/columns", "innerBlocks": [
    {"blockType": "core/column", "innerBlocks": [
      {"blockType": "core/paragraph", "attributes": {"content": "Left column text"}}
    ]},
    {"blockType": "core/column", "innerBlocks": [
      {"blockType": "core/image", "attributes": {"id": 456, "url": "https://...", "alt": "Right image", "sizeSlug": "large"}}
    ]}
  ]}
]

WRONG - Do not do this: {"blocks": [...]} or JSON.stringify([...])`,
                items: {
                    type: 'object',
                    properties: {
                        blockType: {
                            type: 'string',
                            enum: availableBlockTypes,
                            description: `WordPress block type (e.g., "core/heading", "core/paragraph", "core/image", "core/button", "core/columns"). Match the canvas element type.`
                        },
                        attributes: {
                            type: 'object',
                            description: `Block content and settings. CRITICAL: Interpret canvas annotations intelligently and provide real, production-ready content.

CONTENT INTERPRETATION RULES:
- Titles/labels (e.g., "Welcome", "About Us", "Contact") → Use verbatim
- Content prompts (e.g., "Text about whales", "Paragraph describing X") → Generate full, real content on that topic
- Image references (e.g., "Image of lion", "Photo of sunset") → Must call image generation tool first

Common patterns with EXACT attribute names:
- Heading: {"content": "Heading text", "level": 1-6, "textAlign": "left"}
- Paragraph: {"content": "Paragraph text", "align": "left"}  
- Image: {"id": attachment_id_number, "url": "URL from image generation", "alt": "description", "sizeSlug": "large"}
  CRITICAL: Image blocks REQUIRE the "id" number from image generation response (image_id field in data object)
- Button (inside core/buttons): {"text": "Button label", "url": "#"}
- List: {"ordered": false, "values": "<li>Item 1</li><li>Item 2</li><li>Item 3</li>"}
  REQUIRED: Must include "ordered" attribute (true for numbered lists, false for bullet points)
- Columns: No attributes needed, use innerBlocks with core/column children
- Column: No attributes needed, use innerBlocks for column content

WORKING EXAMPLES:
Heading: {"blockType": "core/heading", "attributes": {"content": "Welcome", "level": 1}}
Paragraph: {"blockType": "core/paragraph", "attributes": {"content": "Whales are magnificent..."}}
Image: {"blockType": "core/image", "attributes": {"id": 123, "url": "https://...", "alt": "whale", "sizeSlug": "large"}}
Bullet List: {"blockType": "core/list", "attributes": {"ordered": false, "values": "<li>Paris</li><li>Rome</li><li>London</li>"}}
Numbered List: {"blockType": "core/list", "attributes": {"ordered": true, "values": "<li>First</li><li>Second</li><li>Third</li>"}}`,
                            additionalProperties: true
                        },
                        innerBlocks: {
                            type: 'array',
                            description: 'Child blocks for containers (core/columns, core/group, core/buttons). Same structure: blockType, attributes, innerBlocks.',
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
            analysis: {
                type: 'string',
                description: 'Explain what you found in the canvas and what you created. Mention any images you generated (with their attachment IDs), text you used verbatim, content you generated from prompts, and layout structure you built. Example: "Found heading \'Welcome\' (used verbatim), interpreted \'Text about whales\' and generated informative content, created mountain sunset image (id: 123), built 2-column layout with paragraph and image (id: 456)."'
            },
            replaceExisting: {
                type: 'boolean',
                description: 'If true, replaces all existing editor content. If false (default), appends to existing content.',
                default: false
            },
            targetPosition: {
                type: 'number',
                description: 'Insert position (0-based index). Omit to append to end.'
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

    // Validate and normalize blockStructure
    let parsedBlockStructure: BlockDefinition[];
    
    try {
        // Handle if AI incorrectly sends as string
        if (typeof blockStructure === 'string') {
            const parsed = JSON.parse(blockStructure);
            parsedBlockStructure = Array.isArray(parsed) ? parsed : (parsed.blocks || []);
        } 
        // Handle if it's already an array (expected)
        else if (Array.isArray(blockStructure)) {
            parsedBlockStructure = blockStructure;
        }
        // Handle if wrapped in object
        else if (blockStructure && typeof blockStructure === 'object' && 'blocks' in blockStructure) {
            parsedBlockStructure = (blockStructure as any).blocks;
        }
        else {
            throw new Error('blockStructure must be an array of block definitions');
        }
    } catch (parseError) {
        return {
            content: [{
                type: 'text',
                text: JSON.stringify({
                    success: false,
                    action: 'canvas_to_blocks_failed',
                    error: `Invalid blockStructure format: ${parseError instanceof Error ? parseError.message : 'Could not parse'}. Expected array format: [{"blockType": "core/heading", "attributes": {...}}, ...]`
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
                    error: 'No blocks provided. Analyze the canvas, extract text, generate any needed images first, then provide an array of block definitions with real content.'
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
                        error: 'Could not create any valid blocks. Check: 1) blockType is valid (e.g., "core/heading", "core/paragraph"), 2) attributes contain actual content from canvas, 3) image blocks have valid URLs from image generation tool.'
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
                    error: `Error creating blocks: ${error instanceof Error ? error.message : 'Unknown error'}. Verify: blockType is valid WordPress block, attributes match block requirements, and any image URLs are from image generation tool.`
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