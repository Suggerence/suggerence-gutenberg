import apiFetch from '@wordpress/api-fetch';

export const searchMediaTool: SuggerenceMCPResponseTool = {
    name: 'search_media',
    description: 'Searches the WordPress media library for existing images, videos, audio, or documents. Use this when the user wants to reuse existing media instead of generating new content. Returns media items with IDs, URLs, titles, and metadata that can be used in image/video/audio blocks. More efficient than generating new media if suitable content already exists in the library.',
    inputSchema: {
        type: 'object',
        properties: {
            search: {
                type: 'string',
                description: 'Search query to find media by filename, title, caption, or alt text. Leave empty to get recent media items.'
            },
            mediaType: {
                type: 'string',
                description: 'Filter by media type: "image", "video", "audio", or "application" (for documents). Leave empty to search all types.',
                enum: ['image', 'video', 'audio', 'application', '']
            },
            perPage: {
                type: 'number',
                description: 'Number of results to return (1-100). Defaults to 10.',
                default: 10
            }
        }
    }
};

export const getMediaDetailsTool: SuggerenceMCPResponseTool = {
    name: 'get_media_details',
    description: 'Retrieves complete information about a specific media item by its ID. Returns full metadata including URLs for all available sizes, dimensions, alt text, caption, and file details. Use this when you have a media ID and need complete information to insert it into a block properly.',
    inputSchema: {
        type: 'object',
        properties: {
            mediaId: {
                type: 'number',
                description: 'The WordPress media library ID of the item to retrieve.',
                required: true
            }
        },
        required: ['mediaId']
    }
};

export const getOpenerseImagesTool: SuggerenceMCPResponseTool = {
    name: 'search_openverse',
    description: 'Searches Openverse for free, openly-licensed stock images that can be used legally without copyright concerns. Openverse provides access to over 600 million creative works from sources like Flickr, Wikipedia, and NASA. Use this when the user needs stock photography, illustrations, or reference images without generating AI images. Returns image URLs, titles, creator information, and license details.',
    inputSchema: {
        type: 'object',
        properties: {
            query: {
                type: 'string',
                description: 'Search query describing the desired image (e.g., "sunset beach", "business meeting", "cat playing").',
                required: true
            },
            perPage: {
                type: 'number',
                description: 'Number of results to return (1-20). Defaults to 10.',
                default: 10
            },
            license: {
                type: 'string',
                description: 'Filter by license type. Common options: "cc0" (public domain), "cc-by" (attribution required), "cc-by-sa" (attribution + share-alike). Leave empty for all licenses.',
                enum: ['', 'cc0', 'pdm', 'cc-by', 'cc-by-sa', 'cc-by-nd', 'cc-by-nc', 'cc-by-nc-sa', 'cc-by-nc-nd']
            }
        },
        required: ['query']
    }
};

export const insertOpenerseImageTool: SuggerenceMCPResponseTool = {
    name: 'insert_openverse_image',
    description: 'Downloads an image from Openverse, uploads it to the WordPress media library, and inserts it as an image block in the editor. This is a complete workflow tool that handles the entire process of importing free stock images. The image will be properly attributed according to its license requirements. Pass all the data from search_openverse results for proper attribution.',
    inputSchema: {
        type: 'object',
        properties: {
            imageId: {
                type: 'string',
                description: 'The Openverse image ID from search_openverse results.',
                required: true
            },
            imageUrl: {
                type: 'string',
                description: 'The direct URL to the image from search_openverse results.',
                required: true
            },
            title: {
                type: 'string',
                description: 'The image title for the media library.',
                required: true
            },
            creator: {
                type: 'string',
                description: 'The creator/photographer name for attribution.'
            },
            creatorUrl: {
                type: 'string',
                description: 'URL to the creator\'s profile or website for attribution linking.'
            },
            license: {
                type: 'string',
                description: 'The license type (e.g., "CC0", "CC BY").'
            },
            licenseUrl: {
                type: 'string',
                description: 'URL to the license details page for attribution linking.'
            },
            position: {
                type: 'string',
                description: 'Where to insert the image block: "before", "after", or "end".',
                enum: ['before', 'after', 'end'],
                default: 'after'
            },
            targetBlockId: {
                type: 'string',
                description: 'The block ID to insert relative to. Uses currently selected block if not specified.'
            }
        },
        required: ['imageId', 'imageUrl', 'title']
    }
};

export async function searchMedia(
    search?: string,
    mediaType?: string,
    perPage: number = 10
): Promise<{ content: Array<{ type: string, text: string }> }> {
    try {
        const params = new URLSearchParams();
        params.append('per_page', String(Math.min(Math.max(perPage, 1), 100)));
        params.append('orderby', 'date');
        params.append('order', 'desc');
        
        if (search) {
            params.append('search', search);
        }
        
        if (mediaType) {
            params.append('media_type', mediaType);
        }

        const media: any[] = await apiFetch({
            path: `/wp/v2/media?${params.toString()}`,
            method: 'GET'
        });

        const results = media.map(item => ({
            id: item.id,
            title: item.title?.rendered || '',
            filename: item.source_url?.split('/').pop() || '',
            url: item.source_url,
            mediaType: item.media_type,
            mimeType: item.mime_type,
            alt: item.alt_text || '',
            caption: item.caption?.rendered || '',
            description: item.description?.rendered || '',
            width: item.media_details?.width,
            height: item.media_details?.height,
            filesize: item.media_details?.filesize,
            date: item.date,
            sizes: item.media_details?.sizes || {}
        }));

        return {
            content: [{
                type: 'text',
                text: JSON.stringify({
                    success: true,
                    action: 'media_search_complete',
                    data: {
                        total_found: results.length,
                        media_items: results
                    }
                }, null, 2)
            }]
        };
    } catch (error) {
        return {
            content: [{
                type: 'text',
                text: JSON.stringify({
                    success: false,
                    action: 'media_search_failed',
                    error: `Error searching media library: ${error instanceof Error ? error.message : 'Unknown error'}`
                })
            }]
        };
    }
}

export async function getMediaDetails(
    mediaId: number
): Promise<{ content: Array<{ type: string, text: string }> }> {
    try {
        const media: any = await apiFetch({
            path: `/wp/v2/media/${mediaId}`,
            method: 'GET'
        });

        const details = {
            id: media.id,
            title: media.title?.rendered || '',
            filename: media.source_url?.split('/').pop() || '',
            url: media.source_url,
            mediaType: media.media_type,
            mimeType: media.mime_type,
            alt: media.alt_text || '',
            caption: media.caption?.rendered || '',
            description: media.description?.rendered || '',
            width: media.media_details?.width,
            height: media.media_details?.height,
            filesize: media.media_details?.filesize,
            date: media.date,
            author: media.author,
            sizes: media.media_details?.sizes || {},
            meta: media.meta || {}
        };

        return {
            content: [{
                type: 'text',
                text: JSON.stringify({
                    success: true,
                    action: 'media_details_retrieved',
                    data: details
                }, null, 2)
            }]
        };
    } catch (error) {
        return {
            content: [{
                type: 'text',
                text: JSON.stringify({
                    success: false,
                    action: 'media_details_failed',
                    error: `Error retrieving media details: ${error instanceof Error ? error.message : 'Unknown error'}`
                })
            }]
        };
    }
}

export async function searchOpenverse(
    query: string,
    perPage: number = 10,
    license?: string
): Promise<{ content: Array<{ type: string, text: string }> }> {
    try {
        const params = new URLSearchParams();
        params.append('q', query);
        params.append('page_size', String(Math.min(Math.max(perPage, 1), 20)));
        
        if (license) {
            params.append('license', license);
        }

        const response = await fetch(`https://api.openverse.org/v1/images/?${params.toString()}`, {
            headers: {
                'User-Agent': 'WordPress-Gutenberg-Assistant/1.0'
            }
        });

        if (!response.ok) {
            throw new Error(`Openverse API error: ${response.statusText}`);
        }

        const data = await response.json();

        const results = data.results?.map((item: any) => ({
            id: item.id,
            title: item.title || 'Untitled',
            url: item.url,
            thumbnail: item.thumbnail,
            width: item.width,
            height: item.height,
            creator: item.creator || 'Unknown',
            creator_url: item.creator_url,
            license: item.license,
            license_version: item.license_version,
            license_url: item.license_url,
            attribution: item.attribution,
            source: item.source,
            tags: item.tags?.map((t: any) => t.name) || []
        })) || [];

        return {
            content: [{
                type: 'text',
                text: JSON.stringify({
                    success: true,
                    action: 'openverse_search_complete',
                    data: {
                        total_found: results.length,
                        images: results,
                        attribution_note: 'Remember to include proper attribution when using these images according to their license requirements.'
                    }
                }, null, 2)
            }]
        };
    } catch (error) {
        return {
            content: [{
                type: 'text',
                text: JSON.stringify({
                    success: false,
                    action: 'openverse_search_failed',
                    error: `Error searching Openverse: ${error instanceof Error ? error.message : 'Unknown error'}`
                })
            }]
        };
    }
}

export async function insertOpenverseImage(args: {
    imageId: string;
    imageUrl: string;
    title: string;
    creator?: string;
    creatorUrl?: string;
    license?: string;
    licenseUrl?: string;
    position?: string;
    targetBlockId?: string;
}): Promise<{ content: Array<{ type: string, text: string }> }> {
    try {
        // Import addBlock dynamically to avoid circular dependency
        const { addBlock } = await import('@/shared/mcps/tools/block-manipulation');
        
        // First, sideload the image from Openverse to WordPress Media Library
        const sideloadResponse: any = await apiFetch({
            path: '/suggerence-gutenberg/ai-providers/v1/openverse/sideload',
            method: 'POST',
            data: {
                image_url: args.imageUrl,
                title: args.title,
                alt_text: args.title, // Use title as alt text
                creator: args.creator,
                creator_url: args.creatorUrl || '',
                license: args.license,
                license_url: args.licenseUrl || ''
            }
        });

        if (!sideloadResponse.success) {
            throw new Error(sideloadResponse.error || 'Failed to upload Openverse image');
        }

        // Now insert the image as a block using the WordPress attachment ID
        const imageAttributes = {
            id: sideloadResponse.attachment_id,
            url: sideloadResponse.image_url,
            alt: sideloadResponse.alt_text || args.title,
            caption: sideloadResponse.caption || '',
            sizeSlug: 'large'
        };

        // Insert the image block
        const insertResult = await addBlock(
            'core/image',
            imageAttributes,
            args.position || 'after',
            args.targetBlockId
        );

        // Parse the result to check success
        const resultData = JSON.parse(insertResult.content[0].text);

        if (resultData.success) {
            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify({
                        success: true,
                        action: 'openverse_image_inserted',
                        data: {
                            block_id: resultData.data.block_id,
                            attachment_id: sideloadResponse.attachment_id,
                            image_url: sideloadResponse.image_url,
                            title: args.title,
                            creator: args.creator,
                            license: args.license,
                            caption: sideloadResponse.caption
                        }
                    }, null, 2)
                }]
            };
        } else {
            throw new Error('Failed to insert image block');
        }
    } catch (error) {
        return {
            content: [{
                type: 'text',
                text: JSON.stringify({
                    success: false,
                    action: 'openverse_insert_failed',
                    error: `Error inserting Openverse image: ${error instanceof Error ? error.message : 'Unknown error'}`
                })
            }]
        };
    }
}

