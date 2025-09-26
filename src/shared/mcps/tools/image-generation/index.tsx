import { dispatch, select } from '@wordpress/data';
import { createBlock } from '@wordpress/blocks';

export const addGeneratedImageTool: SuggerenceMCPResponseTool = {
    name: 'add_generated_image',
    description: 'Generate and add an image to the editor using nano banana',
    inputSchema: {
        type: 'object',
        properties: {
            prompt: {
                type: 'string',
                description: 'The text prompt describing the image to generate, or a base64 encoded image'
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
};

export const generateImageWithInputsTool: SuggerenceMCPResponseTool = {
    name: 'generate_image_with_inputs',
    description: 'Generate and add an image to the editor using a text prompt along with input images as reference',
    inputSchema: {
        type: 'object',
        properties: {
            prompt: {
                type: 'string',
                description: 'The text the user sent to ask for an image'
            },
            input_images: {
                type: 'array',
                description: 'Array of input images to use as reference for generation',
                items: {
                    type: 'object',
                    properties: {
                        data: {
                            type: 'string',
                            description: 'Base64 encoded image data'
                        },
                        media_type: {
                            type: 'string',
                            description: 'MIME type of the image (e.g., image/png, image/jpeg)'
                        },
                        url: {
                            type: 'string',
                            description: 'URL of the image (alternative to base64 data)'
                        }
                    }
                }
            },
            position: {
                type: 'string',
                description: 'Where to insert the image relative to selected block (before, after, or end)',
                enum: ['before', 'after', 'end']
            },
            alt_text: {
                type: 'string',
                description: 'Alternative text for the image'
            }
        },
        required: ['prompt', 'input_images']
    }
};

export const editImageTool: SuggerenceMCPResponseTool = {
    name: 'edit_image',
    description: 'Edit/modify an existing image using AI. This will actually modify the provided image rather than just using it as reference.',
    inputSchema: {
        type: 'object',
        properties: {
            prompt: {
                type: 'string',
                description: 'Description of how to edit/modify the image (e.g., "make the capibara jump", "change the background to blue")'
            },
            image_url: {
                type: 'string',
                description: 'URL of the image to edit'
            },
            position: {
                type: 'string',
                description: 'Where to insert the edited image relative to selected block (before, after, or end)',
                enum: ['before', 'after', 'end']
            },
            alt_text: {
                type: 'string',
                description: 'Alternative text for the edited image'
            }
        },
        required: ['prompt', 'image_url']
    }
};

export async function addGeneratedImage(prompt: string, position: string = 'after', altText?: string): Promise<{ content: Array<{ type: string, text: string }> }> {
    try {
        const imageResponse = await generateImageWithNanoBanana(prompt);

        if (!imageResponse.success) {
            throw new Error(imageResponse.error || 'Failed to generate image');
        }

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
            index = undefined;
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

export async function generateImageWithInputs(
    prompt: string,
    inputImages: Array<{ data?: string; media_type?: string; url?: string }>,
    position: string = 'after',
    altText?: string
): Promise<{ content: Array<{ type: string, text: string }> }> {
    try {
        const imageResponse = await generateImageWithNanoBananaAndInputs(prompt, inputImages);

        if (!imageResponse.success) {
            throw new Error(imageResponse.error || 'Failed to generate image');
        }

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
            index = undefined;
        }

        insertBlock(newBlock, index);

        return {
            content: [{
                type: 'text',
                text: `Generated and added image with prompt: "${prompt}" using ${inputImages.length} input image(s). Image URL: ${imageResponse.image_url}`
            }]
        };
    } catch (error) {
        throw new Error(`Failed to generate and add image with inputs: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

export async function editImage(
    prompt: string,
    imageUrl: string,
    position: string = 'after',
    altText?: string
): Promise<{ content: Array<{ type: string, text: string }> }> {
    try {
        const imageResponse = await editImageWithAI(prompt, imageUrl);

        if (!imageResponse.success) {
            throw new Error(imageResponse.error || 'Failed to edit image');
        }

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
            index = undefined;
        }

        insertBlock(newBlock, index);

        return {
            content: [{
                type: 'text',
                text: `Edited and added image with prompt: "${prompt}". Original image: ${imageUrl}. New image URL: ${imageResponse.image_url}`
            }]
        };
    } catch (error) {
        throw new Error(`Failed to edit and add image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

async function editImageWithAI(
    prompt: string,
    imageUrl: string
): Promise<{ success: boolean; image_url?: string; attachment_id?: number; error?: string }> {
    try {
        const response = await fetch('/wp-json/suggerence-gutenberg/ai-providers/v1/providers/image', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-WP-Nonce': (window as any).wpApiSettings?.nonce || ''
            },
            body: JSON.stringify({
                prompt: prompt,
                provider: 'gemini',
                model: 'gemini-2.5-flash-image-preview',
                edit_mode: true,
                edit_image_url: imageUrl
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error editing image:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
}

async function generateImageWithNanoBananaAndInputs(
    prompt: string,
    inputImages: Array<{ data?: string; media_type?: string; url?: string }>
): Promise<{ success: boolean; image_url?: string; attachment_id?: number; error?: string }> {
    try {
        const response = await fetch('/wp-json/suggerence-gutenberg/ai-providers/v1/providers/image', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-WP-Nonce': (window as any).wpApiSettings?.nonce || ''
            },
            body: JSON.stringify({
                prompt: prompt,
                provider: 'gemini',
                model: 'gemini-2.5-flash-image-preview',
                input_images: inputImages
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error generating image with inputs:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
}

export async function generateImageWithNanoBanana(prompt: string): Promise<{ success: boolean; image_url?: string; attachment_id?: number; error?: string }> {
    try {
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