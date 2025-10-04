import { select, dispatch } from '@wordpress/data';
import apiFetch from '@wordpress/api-fetch';

export const getDocumentStructureTool: SuggerenceMCPResponseTool = {
    name: 'get_document_structure',
    description: 'Retrieves a complete outline of all blocks in the current document, including their IDs, types, positions, and content previews. Use this when you need to understand the document structure, find specific blocks, or determine what content exists before making changes. Essential for complex operations that need to know the full context of the document.',
    inputSchema: {
        type: 'object',
        properties: {
            includeContent: {
                type: 'boolean',
                description: 'Whether to include content previews for text blocks. Set to true for full context, false for faster response with just block structure.',
                default: true
            },
            maxContentLength: {
                type: 'number',
                description: 'Maximum characters of content to include per block (only if includeContent is true). Defaults to 100.',
                default: 100
            }
        }
    }
};

export const searchBlocksByContentTool: SuggerenceMCPResponseTool = {
    name: 'search_blocks_by_content',
    description: 'Searches through all blocks in the document to find blocks containing specific text or patterns. Returns block IDs and positions of matching blocks. Use this when the user references content indirectly (e.g., "change the paragraph that mentions pricing" or "delete the heading that says welcome").',
    inputSchema: {
        type: 'object',
        properties: {
            searchQuery: {
                type: 'string',
                description: 'The text to search for within block content. Can be exact phrase or partial match.',
                required: true
            },
            blockType: {
                type: 'string',
                description: 'Optional: filter results to specific block type (e.g., "core/paragraph", "core/heading"). Leave empty to search all blocks.'
            },
            caseSensitive: {
                type: 'boolean',
                description: 'Whether the search should be case-sensitive. Defaults to false.',
                default: false
            }
        },
        required: ['searchQuery']
    }
};

export const getPostMetadataTool: SuggerenceMCPResponseTool = {
    name: 'get_post_metadata',
    description: 'Retrieves metadata about the current post/page including title, excerpt, categories, tags, featured image, author, publish date, and status. Use this to understand the context of the current document or when the user asks about post properties. Provides comprehensive information about the document beyond just the block content.',
    inputSchema: {
        type: 'object',
        properties: {}
    }
};

export const updatePostTitleTool: SuggerenceMCPResponseTool = {
    name: 'update_post_title',
    description: 'Changes the title of the current post or page. Use this when the user explicitly requests to change the document title (not to be confused with heading blocks within the content). The title appears in the browser tab, search results, and at the top of the editor.',
    inputSchema: {
        type: 'object',
        properties: {
            title: {
                type: 'string',
                description: 'The new title for the post/page.',
                required: true
            }
        },
        required: ['title']
    }
};

export const updatePostExcerptTool: SuggerenceMCPResponseTool = {
    name: 'update_post_excerpt',
    description: 'Sets or updates the post excerpt (summary). The excerpt is used in post listings, search results, and social media sharing. Use this when the user wants to add or change the post summary, or when you\'ve generated a summary of the content.',
    inputSchema: {
        type: 'object',
        properties: {
            excerpt: {
                type: 'string',
                description: 'The new excerpt text. Can be plain text or HTML.',
                required: true
            }
        },
        required: ['excerpt']
    }
};

export const setFeaturedImageTool: SuggerenceMCPResponseTool = {
    name: 'set_featured_image',
    description: 'Sets the featured image (post thumbnail) for the current post/page. The featured image is displayed in post listings, social media shares, and at the top of posts in many themes. Essential for SEO and visual appeal. Use this after uploading or generating an image that should represent the post. You can get media IDs from search_media or generate_image results.',
    inputSchema: {
        type: 'object',
        properties: {
            mediaId: {
                type: 'number',
                description: 'The WordPress media library ID of the image to set as featured. Get this from search_media results or from the generate_image response (image_id field).',
                required: true
            }
        },
        required: ['mediaId']
    }
};

export const removeFeaturedImageTool: SuggerenceMCPResponseTool = {
    name: 'remove_featured_image',
    description: 'Removes the featured image from the current post/page. Use this when the user wants to clear the featured image or when replacing it with a new one.',
    inputSchema: {
        type: 'object',
        properties: {}
    }
};

export function getDocumentStructure(
    includeContent: boolean = true,
    maxContentLength: number = 100
): { content: Array<{ type: string, text: string }> } {
    try {
        const { getBlocks } = select('core/block-editor') as any;
        const allBlocks = getBlocks();

        const extractBlockInfo = (block: any, parentId: string | null = null, index: number = 0): any => {
            const info: any = {
                clientId: block.clientId,
                name: block.name,
                position: index,
                parentId: parentId
            };

            // Include content preview if requested
            if (includeContent) {
                if (block.attributes?.content) {
                    // Strip HTML tags for preview
                    const tempDiv = document.createElement('div');
                    tempDiv.innerHTML = block.attributes.content;
                    const textContent = tempDiv.textContent || tempDiv.innerText || '';
                    info.contentPreview = textContent.substring(0, maxContentLength) +
                        (textContent.length > maxContentLength ? '...' : '');
                }

                // Include other relevant attributes
                if (block.attributes?.url) info.url = block.attributes.url;
                if (block.attributes?.level) info.level = block.attributes.level;
                if (block.attributes?.ordered !== undefined) info.ordered = block.attributes.ordered;
            }

            // Process inner blocks recursively
            if (block.innerBlocks && block.innerBlocks.length > 0) {
                info.innerBlocks = block.innerBlocks.map((innerBlock: any, idx: number) =>
                    extractBlockInfo(innerBlock, block.clientId, idx)
                );
                info.innerBlockCount = block.innerBlocks.length;
            }

            return info;
        };

        const structure = allBlocks.map((block: any, idx: number) => extractBlockInfo(block, null, idx));

        return {
            content: [{
                type: 'text',
                text: JSON.stringify({
                    success: true,
                    action: 'document_structure_retrieved',
                    data: {
                        total_blocks: allBlocks.length,
                        blocks: structure
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
                    action: 'document_structure_failed',
                    error: `Error retrieving document structure: ${error instanceof Error ? error.message : 'Unknown error'}`
                })
            }]
        };
    }
}

export function searchBlocksByContent(
    searchQuery: string,
    blockType?: string,
    caseSensitive: boolean = false
): { content: Array<{ type: string, text: string }> } {
    try {
        const { getBlocks } = select('core/block-editor') as any;
        const allBlocks = getBlocks();

        const searchTerm = caseSensitive ? searchQuery : searchQuery.toLowerCase();
        const matches: any[] = [];

        const searchBlock = (block: any, parentId: string | null = null, position: number = 0) => {
            // Filter by block type if specified
            if (blockType && block.name !== blockType) {
                // Still search inner blocks
                if (block.innerBlocks) {
                    block.innerBlocks.forEach((innerBlock: any, idx: number) => {
                        searchBlock(innerBlock, block.clientId, idx);
                    });
                }
                return;
            }

            // Search in block content
            let content = '';
            if (block.attributes?.content) {
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = block.attributes.content;
                content = tempDiv.textContent || tempDiv.innerText || '';
            } else if (block.attributes?.text) {
                content = block.attributes.text;
            } else if (block.attributes?.values) {
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = block.attributes.values;
                content = tempDiv.textContent || tempDiv.innerText || '';
            }

            const searchableContent = caseSensitive ? content : content.toLowerCase();

            if (searchableContent.includes(searchTerm)) {
                matches.push({
                    clientId: block.clientId,
                    name: block.name,
                    position: position,
                    parentId: parentId,
                    matchedContent: content.substring(
                        Math.max(0, searchableContent.indexOf(searchTerm) - 30),
                        Math.min(content.length, searchableContent.indexOf(searchTerm) + searchTerm.length + 30)
                    )
                });
            }

            // Search inner blocks
            if (block.innerBlocks) {
                block.innerBlocks.forEach((innerBlock: any, idx: number) => {
                    searchBlock(innerBlock, block.clientId, idx);
                });
            }
        };

        allBlocks.forEach((block: any, idx: number) => searchBlock(block, null, idx));

        return {
            content: [{
                type: 'text',
                text: JSON.stringify({
                    success: true,
                    action: 'blocks_searched',
                    data: {
                        search_query: searchQuery,
                        matches_found: matches.length,
                        matches: matches
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
                    action: 'block_search_failed',
                    error: `Error searching blocks: ${error instanceof Error ? error.message : 'Unknown error'}`
                })
            }]
        };
    }
}

export async function getPostMetadata(): Promise<{ content: Array<{ type: string, text: string }> }> {
    try {
        const { getCurrentPost } = select('core/editor') as any;
        const post = getCurrentPost();

        if (!post) {
            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify({
                        success: false,
                        action: 'post_metadata_failed',
                        error: 'No post data available. This may not be a post/page editor context.'
                    })
                }]
            };
        }

        const metadata = {
            id: post.id,
            title: post.title,
            slug: post.slug,
            status: post.status,
            type: post.type,
            excerpt: post.excerpt,
            featured_media: post.featured_media,
            author: post.author,
            date: post.date,
            modified: post.modified,
            categories: post.categories,
            tags: post.tags,
            permalink: post.link,
            comment_status: post.comment_status,
            ping_status: post.ping_status,
            sticky: post.sticky,
            template: post.template,
            meta: post.meta
        };

        return {
            content: [{
                type: 'text',
                text: JSON.stringify({
                    success: true,
                    action: 'post_metadata_retrieved',
                    data: metadata
                }, null, 2)
            }]
        };
    } catch (error) {
        return {
            content: [{
                type: 'text',
                text: JSON.stringify({
                    success: false,
                    action: 'post_metadata_failed',
                    error: `Error retrieving post metadata: ${error instanceof Error ? error.message : 'Unknown error'}`
                })
            }]
        };
    }
}

export function updatePostTitle(title: string): { content: Array<{ type: string, text: string }> } {
    try {
        const { editPost } = dispatch('core/editor') as any;
        editPost({ title });

        return {
            content: [{
                type: 'text',
                text: JSON.stringify({
                    success: true,
                    action: 'post_title_updated',
                    data: {
                        new_title: title
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
                    action: 'post_title_update_failed',
                    error: `Error updating post title: ${error instanceof Error ? error.message : 'Unknown error'}`
                })
            }]
        };
    }
}

export function updatePostExcerpt(excerpt: string): { content: Array<{ type: string, text: string }> } {
    try {
        const { editPost } = dispatch('core/editor') as any;
        editPost({ excerpt });

        return {
            content: [{
                type: 'text',
                text: JSON.stringify({
                    success: true,
                    action: 'post_excerpt_updated',
                    data: {
                        new_excerpt: excerpt
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
                    action: 'post_excerpt_update_failed',
                    error: `Error updating post excerpt: ${error instanceof Error ? error.message : 'Unknown error'}`
                })
            }]
        };
    }
}

export function setFeaturedImage(mediaId: number): { content: Array<{ type: string, text: string }> } {
    try {
        const { editPost } = dispatch('core/editor') as any;
        const { getCurrentPost } = select('core/editor') as any;
        
        // Set the featured media ID
        editPost({ featured_media: mediaId });
        
        // Get the current post to verify
        const post = getCurrentPost();
        const currentFeaturedMedia = post?.featured_media;

        return {
            content: [{
                type: 'text',
                text: JSON.stringify({
                    success: true,
                    action: 'featured_image_set',
                    data: {
                        media_id: mediaId,
                        verified_id: currentFeaturedMedia,
                        message: 'Featured image has been set. Changes will be saved when you update/publish the post.'
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
                    action: 'featured_image_set_failed',
                    error: `Error setting featured image: ${error instanceof Error ? error.message : 'Unknown error'}`
                })
            }]
        };
    }
}

export function removeFeaturedImage(): { content: Array<{ type: string, text: string }> } {
    try {
        const { editPost } = dispatch('core/editor') as any;
        
        // Remove the featured media by setting it to 0
        editPost({ featured_media: 0 });

        return {
            content: [{
                type: 'text',
                text: JSON.stringify({
                    success: true,
                    action: 'featured_image_removed',
                    data: {
                        message: 'Featured image has been removed. Changes will be saved when you update/publish the post.'
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
                    action: 'featured_image_remove_failed',
                    error: `Error removing featured image: ${error instanceof Error ? error.message : 'Unknown error'}`
                })
            }]
        };
    }
}

