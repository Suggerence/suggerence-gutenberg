import apiFetch from "@wordpress/api-fetch";

export const generateImageTool: SuggerenceMCPResponseTool = {
    name: 'generate_image',
    description: 'Creates a new AI-generated image from a text description and uploads it to the WordPress media library. Use this when the user requests to create, generate, or design an image from scratch based on their description. The generated image is automatically uploaded to the media library and can be inserted into the document. Supports reference images for style matching or image-to-image generation.',
    inputSchema: {
        type: 'object',
        properties: {
            prompt: {
                type: 'string',
                description: 'A detailed text description of the image to generate. Be specific about the subject, style, composition, colors, mood, and any important details. Examples: "A serene mountain landscape at sunset with purple and orange sky", "Modern minimalist logo for a coffee shop with geometric shapes", "Professional product photo of a blue water bottle on white background". More detailed prompts generally produce better results.'
            },
            alt_text: {
                type: 'string',
                description: 'Accessibility alternative text that describes the image for screen readers and SEO. Should be a concise description of what the image shows. If not provided, the prompt will be used as alt text. Example: "Mountain landscape at sunset" rather than repeating the full prompt.'
            },
            input_images: {
                type: 'array',
                description: 'Optional array of reference images to guide the generation. Use this for style transfer, image-to-image generation, or when you want the AI to match a specific visual style. Each image can be provided as base64 data or a URL. Useful when the user wants consistency with existing images or needs to maintain a specific visual style.',
                items: {
                    type: 'object',
                    properties: {
                        data: {
                            type: 'string',
                            description: 'Base64-encoded image data (without the data:image/... prefix). Use this when you have the image content directly available.'
                        },
                        media_type: {
                            type: 'string',
                            description: 'MIME type specifying the image format. Common values: "image/png", "image/jpeg", "image/webp". Required when using base64 data.'
                        },
                        url: {
                            type: 'string',
                            description: 'Direct URL to the reference image. Use this as an alternative to base64 data when the image is already hosted somewhere. The URL must be publicly accessible.'
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
    description: 'Modifies an existing image using AI based on text instructions, creating a new edited version. Use this when the user wants to edit, modify, transform, or make changes to an existing image rather than creating one from scratch. Examples: changing backgrounds, adding/removing elements, changing colors or style, or applying transformations. The edited image is saved as a new file in the media library, preserving the original.',
    inputSchema: {
        type: 'object',
        properties: {
            prompt: {
                type: 'string',
                description: 'Clear instructions describing what changes to make to the image. Use imperative commands focusing on the desired changes. Examples: "change the background to a sunset beach scene", "remove the person on the left", "make the sky darker and more dramatic", "change all blue elements to green", "add falling snow in the scene". Be specific about what should change while the rest remains the same.'
            },
            image_url: {
                type: 'string',
                description: 'The URL of the source image to edit. This must be a valid, publicly accessible image URL (can be from the WordPress media library or external). Supported formats include JPEG, PNG, and WebP. The image will be used as the base for the AI editing operation.'
            },
            alt_text: {
                type: 'string',
                description: 'Accessibility alternative text for the edited image. Should describe what the final edited image shows, not the original. If omitted, the edit prompt will be used. Example: "Beach scene with sunset background" after changing the background.'
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
            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify({
                        success: false,
                        action: 'image_generation_failed',
                        error: imageResponse.error || 'Failed to generate image'
                    })
                }]
            };
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
        return {
            content: [{
                type: 'text',
                text: JSON.stringify({
                    success: false,
                    action: 'image_generation_failed',
                    error: `Failed to generate image: ${error instanceof Error ? error.message : 'Unknown error'}`
                })
            }]
        };
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