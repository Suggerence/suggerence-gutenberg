export const generateImageTool: SuggerenceMCPResponseTool = {
    name: 'generate_image',
    description: 'Generate an image based on a text prompt',
    inputSchema: {
        type: 'object',
        properties: {
            prompt: {
                type: 'string',
                description: 'The text prompt describing the image to generate, or a base64 encoded image'
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
    description: 'Generate an image using a text prompt along with input images as reference',
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
            alt_text: {
                type: 'string',
                description: 'Alternative text for the image'
            }
        },
        required: ['prompt', 'input_images']
    }
};

export const generateEditedImageTool: SuggerenceMCPResponseTool = {
    name: 'generate_edited_image',
    description: 'Generate an edited image based on a text prompt and an existing image.',
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
            alt_text: {
                type: 'string',
                description: 'Alternative text for the edited image'
            }
        },
        required: ['prompt', 'image_url']
    }
};

export async function generateImage(prompt: string, altText?: string): Promise<{ content: Array<{ type: string, text: string }> }> {
    try {
        const imageResponse = await generateImageWithAI(prompt);

        if (!imageResponse.success) {
            throw new Error(imageResponse.error || 'Failed to generate image');
        }

        const result = {
            success: true,
            action: 'image_generated',
            data: {
                image_id: imageResponse.attachment_id,
                image_url: imageResponse.image_url,
                prompt: prompt,
                alt_text: altText || prompt
            }
        };

        return {
            content: [{
                type: 'text',
                text: JSON.stringify(result, null, 2)
            }]
        };
    } catch (error) {
        throw new Error(`Failed to generate image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

export async function generateImageWithInputs(
    prompt: string,
    inputImages: Array<{ data?: string; media_type?: string; url?: string }>,
    altText?: string
): Promise<{ content: Array<{ type: string, text: string }> }> {
    try {
        const imageResponse = await generateImageWithAIAndInputs(prompt, inputImages);

        if (!imageResponse.success) {
            throw new Error(imageResponse.error || 'Failed to generate image');
        }

        const result = {
            success: true,
            action: 'image_generated',
            data: {
                image_id: imageResponse.attachment_id,
                image_url: imageResponse.image_url,
                prompt: prompt,
                alt_text: altText || prompt,
                input_images_count: inputImages.length
            }
        };

        return {
            content: [{
                type: 'text',
                text: JSON.stringify(result, null, 2)
            }]
        };
    } catch (error) {
        throw new Error(`Failed to generate image with inputs: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

export async function generateEditedImage(
    prompt: string,
    imageUrl: string,
    altText?: string
): Promise<{ content: Array<{ type: string, text: string }> }> {
    try {
        const imageResponse = await generateEditedImageWithAI(prompt, imageUrl);

        if (!imageResponse.success) {
            throw new Error(imageResponse.error || 'Failed to edit image');
        }

        const result = {
            success: true,
            action: 'image_generated',
            data: {
                image_id: imageResponse.attachment_id,
                image_url: imageResponse.image_url,
                original_image_url: imageUrl,
                prompt: prompt,
                alt_text: altText || prompt
            }
        };

        return {
            content: [{
                type: 'text',
                text: JSON.stringify(result, null, 2)
            }]
        };
    } catch (error) {
        throw new Error(`Failed to edit image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

async function generateEditedImageWithAI(
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

async function generateImageWithAIAndInputs(
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

export async function generateImageWithAI(prompt: string): Promise<{ success: boolean; image_url?: string; attachment_id?: number; error?: string }> {
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