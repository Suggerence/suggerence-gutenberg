import apiFetch from "@wordpress/api-fetch";
import { getWebsocketAuthToken, clearWebsocketAuthToken } from '@/shared/auth/websocketToken';

declare const SuggerenceData: SuggerenceData;

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
        const imageResponse = await generateImageWithAI(prompt, altText, inputImages, editImageUrl);

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
    altText?: string,
    inputImages?: Array<{ data?: string; media_type?: string; url?: string }>,
    editImageUrl?: string
): Promise<{ success: boolean; image_url?: string; attachment_id?: number; error?: string }> {
    try {
        const payload = await buildSuggerenceImagePayload(prompt, inputImages, editImageUrl);
        const apiResponse = await requestSuggerenceImage(payload);
        const imageData = extractGeneratedImage(apiResponse);

        if (!imageData) {
            return {
                success: false,
                error: 'Suggerence API did not return any image data'
            };
        }

        const uploadResult = await uploadImageToWordPress(imageData, prompt, altText || prompt);

        return {
            success: true,
            image_url: uploadResult.image_url,
            attachment_id: uploadResult.attachment_id
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
}

type InlineImage = { data: string; mimeType?: string };

const buildSuggerenceImagePayload = async (
    prompt: string,
    inputImages?: Array<{ data?: string; media_type?: string; url?: string }>,
    editImageUrl?: string
): Promise<Record<string, unknown>> => {
    const parts: Array<Record<string, unknown>> = [
        { text: prompt }
    ];

    const inlineImages: InlineImage[] = [];

    if (Array.isArray(inputImages)) {
        for (const image of inputImages) {
            if (image.data && image.media_type) {
                inlineImages.push({
                    data: normalizeBase64(image.data),
                    mimeType: image.media_type
                });
            } else if (image.url) {
                inlineImages.push(await fetchImageAsBase64(image.url));
            }
        }
    }

    if (editImageUrl) {
        inlineImages.push(await fetchImageAsBase64(editImageUrl));
    }

    inlineImages.forEach((image) => {
        parts.push({
            inline_data: {
                mime_type: image.mimeType || 'image/png',
                data: image.data
            }
        });
    });

    return {
        contents: [
            {
                parts
            }
        ],
        generationConfig: {
            responseModalities: ['TEXT', 'IMAGE']
        }
    };
};

const getSuggerenceImageEndpoint = (): string => {
    const base = SuggerenceData.suggerence_api_url.replace(/\/$/, '');
    return `${base}/gutenberg/image`;
};

const requestSuggerenceImage = async (payload: Record<string, unknown>): Promise<any> => {
    const requestOnce = async (retry: boolean): Promise<any> => {
        const token = await getWebsocketAuthToken();
        const response = await fetch(getSuggerenceImageEndpoint(), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            credentials: 'omit',
            body: JSON.stringify(payload)
        });

        if ((response.status === 401 || response.status === 403) && retry) {
            clearWebsocketAuthToken();
            return requestOnce(false);
        }

        let data: any = null;
        try {
            data = await response.json();
        } catch {
            // Ignore JSON parsing errors for now
        }

        if (!response.ok) {
            const message = data?.error || data?.message || `Suggerence API request failed (${response.status})`;
            throw new Error(message);
        }

        return data;
    };

    return requestOnce(true);
};

const extractGeneratedImage = (response: any): InlineImage | null => {
    if (!response || typeof response !== 'object') {
        return null;
    }

    const fromGeneratedImages = Array.isArray(response.generatedImages) ? response.generatedImages[0] : null;
    if (fromGeneratedImages) {
        return {
            data: fromGeneratedImages.bytesBase64Encoded || fromGeneratedImages.data || '',
            mimeType: fromGeneratedImages.mimeType || fromGeneratedImages.mime_type
        };
    }

    const fromPredictions = Array.isArray(response.predictions) ? response.predictions[0] : null;
    if (fromPredictions) {
        return {
            data: fromPredictions.bytesBase64Encoded || fromPredictions.data || '',
            mimeType: fromPredictions.mimeType || fromPredictions.mime_type
        };
    }

    if (Array.isArray(response.candidates)) {
        for (const candidate of response.candidates) {
            const content = candidate?.content;
            const parts = Array.isArray(content?.parts) ? content.parts : candidate?.parts;
            if (!Array.isArray(parts)) {
                continue;
            }

            for (const part of parts) {
                const inline = part?.inlineData || part?.inline_data;
                if (inline?.data) {
                    return {
                        data: inline.data,
                        mimeType: inline.mimeType || inline.mime_type
                    };
                }
            }
        }
    }

    return null;
};

const uploadImageToWordPress = async (image: InlineImage, prompt: string, altText: string) => {
    if (!image.data) {
        throw new Error('Missing image data');
    }

    const mimeType = image.mimeType || 'image/png';
    const arrayBuffer = base64ToArrayBuffer(image.data);
    const blob = new Blob([arrayBuffer], { type: mimeType });
    const extension = inferFileExtension(mimeType);
    const filename = buildFilename(prompt, extension);

    const formData = new FormData();
    formData.append('file', blob, filename);
    formData.append('title', prompt);
    formData.append('alt_text', altText);

    const media = await apiFetch<any>({
        path: '/wp/v2/media',
        method: 'POST',
        body: formData
    });

    if (!media?.id || !media?.source_url) {
        throw new Error('Failed to save generated image to media library');
    }

    return {
        attachment_id: typeof media.id === 'number' ? media.id : Number(media.id),
        image_url: media.source_url as string
    };
};

const fetchImageAsBase64 = async (url: string): Promise<InlineImage> => {
    const response = await fetch(url, { credentials: 'include' });
    if (!response.ok) {
        throw new Error(`Failed to load image from ${url}`);
    }

    const blob = await response.blob();
    const buffer = await blob.arrayBuffer();

    return {
        data: arrayBufferToBase64(buffer),
        mimeType: blob.type || inferMimeFromUrl(url)
    };
};

const normalizeBase64 = (input: string): string => {
    const commaIndex = input.indexOf(',');
    const base64 = commaIndex >= 0 ? input.substring(commaIndex + 1) : input;
    return base64.trim();
};

const inferFileExtension = (mimeType: string): string => {
    if (mimeType === 'image/jpeg' || mimeType === 'image/jpg') {
        return 'jpg';
    }
    if (mimeType === 'image/webp') {
        return 'webp';
    }
    if (mimeType === 'image/gif') {
        return 'gif';
    }
    return 'png';
};

const buildFilename = (prompt: string, extension: string): string => {
    const slug = prompt
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 50) || 'generated-image';

    return `${slug}-${Date.now()}.${extension}`;
};

const base64ToArrayBuffer = (base64: string): ArrayBuffer => {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
};

const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
};

const inferMimeFromUrl = (url: string): string => {
    const extensionMatch = url.split('.').pop()?.toLowerCase();
    switch (extensionMatch) {
        case 'jpg':
        case 'jpeg':
            return 'image/jpeg';
        case 'gif':
            return 'image/gif';
        case 'webp':
            return 'image/webp';
        case 'svg':
            return 'image/svg+xml';
        default:
            return 'image/png';
    }
};
