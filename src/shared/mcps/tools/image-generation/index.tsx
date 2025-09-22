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