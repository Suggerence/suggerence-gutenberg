import apiFetch from "@wordpress/api-fetch";

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
        },
        required: ['prompt']
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

export async function generateImage(
    prompt: string,
    altText?: string,
    inputImages?: Array<{ data?: string; media_type?: string; url?: string }>,
    editImageUrl?: string
): Promise<{ content: Array<{ type: string, text: string }> }> {
    try {
        const imageResponse = await generateImageWithAI(prompt, inputImages, editImageUrl);

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
                ...(editImageUrl && { original_image_url: editImageUrl }),
                ...(inputImages && { input_images_count: inputImages.length })
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

export async function generateEditedImage(
    prompt: string,
    imageUrl: string,
    altText?: string
): Promise<{ content: Array<{ type: string, text: string }> }> {
    return generateImage(prompt, altText, undefined, imageUrl);
}

async function generateImageWithAI(
    prompt: string,
    inputImages?: Array<{ data?: string; media_type?: string; url?: string }>,
    editImageUrl?: string
): Promise<{ success: boolean; image_url?: string; attachment_id?: number; error?: string }> {
    try {
        const data = await apiFetch({
            path: '/suggerence-gutenberg/ai-providers/v1/providers/image',
            method: 'POST',
            data: {
                prompt: prompt,
                model: 'suggerence-v1',
                provider: 'suggerence',
                ...(editImageUrl && {
                    edit_mode: true,
                    edit_image_url: editImageUrl
                }),
                ...(inputImages && { input_images: inputImages })
            }
        });

        return data as { success: boolean; image_url?: string; attachment_id?: number; error?: string };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
}