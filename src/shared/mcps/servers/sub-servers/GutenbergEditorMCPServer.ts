import {
    addBlockTool, addBlock,
    moveBlockTool, moveBlock,
    duplicateBlockTool, duplicateBlock,
    deleteBlockTool, deleteBlock,
    updateBlockTool, updateBlock,
    transformBlockTool, transformBlock,
    wrapBlockTool, wrapBlock,
    undo, undoTool,
    redo, redoTool
} from '@/shared/mcps/tools/block-manipulation';
import {
    generateImageTool, generateImage,
    generateEditedImageTool, generateEditedImage
} from '@/shared/mcps/tools/image-generation';
import {
    getAvailableBlocksTool, getAvailableBlocks,
    getBlockSchemaTool, getBlockSchema    
} from '@/shared/mcps/tools/block-schema';
import {
    SearchPatternTool, searchPattern,
    insertPatternTool, insertPattern
} from '@/shared/mcps/tools/patterns-layouts';
import {
    searchMediaTool, searchMedia,
    getOpenerseImagesTool, searchOpenverse,
    uploadOpenverseToMediaTool, uploadOpenverseToMedia
} from '@/shared/mcps/tools/media-library';
import {
    updatePostTitleTool, updatePostTitle,
    updatePostExcerptTool, updatePostExcerpt,
    setFeaturedImageTool, setFeaturedImage,
    removeFeaturedImageTool, removeFeaturedImage,
    getPostContentTool, getPostContent
} from '@/shared/mcps/tools/document-tools';

export class GutenbergEditorMCPServer {
    static initialize(): SuggerenceMCPServerConnection {
        return {
            name: 'gutenberg-editor',
            title: 'Gutenberg Editor',
            description: 'Core Gutenberg block editor operations and document management',
            protocol_version: '1.0.0',
            endpoint_url: 'http://localhost:3000',
            is_active: true,
            type: 'core',
            connected: true,
            client: new GutenbergEditorMCPServer(),
            id: 1,
            capabilities: 'block-manipulation,media-management,document-operations',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        }
    }

    private staticTools: SuggerenceMCPResponseTool[] = [
        addBlockTool,
        moveBlockTool,
        duplicateBlockTool,
        updateBlockTool,
        transformBlockTool,
        wrapBlockTool,
        generateImageTool,
        generateEditedImageTool,
        insertPatternTool,
        getBlockSchemaTool,
        getAvailableBlocksTool,
        undoTool,
        redoTool,
        searchMediaTool,
        getOpenerseImagesTool,
        uploadOpenverseToMediaTool,
        updatePostTitleTool,
        updatePostExcerptTool,
        setFeaturedImageTool,
        removeFeaturedImageTool,
        getPostContentTool
    ];

    listTools(): { tools: SuggerenceMCPResponseTool[] } {
        return {
            tools: [
                ...this.staticTools,
                SearchPatternTool(),
                deleteBlockTool()
            ]
        };
    }

    async callTool(params: { name: string, arguments: Record<string, any> }): Promise<{ content: Array<{ type: string, text: string }> }> {
        const { name, arguments: args } = params;

        try {
            switch (name) {
                case 'add_block':
                    return addBlock(args.block_type, args.attributes, args.position, args.relative_to_block_id, args.inner_blocks, args.style);

                case 'move_block':
                    return moveBlock({
                        targetBlockId: args.relative_to_block_id,
                        position: args.position,
                        blockId: args.block_id
                    });

                case 'duplicate_block':
                    return duplicateBlock(args.block_id, args.position);

                case 'delete_block':
                    return deleteBlock(args.block_id || args.id);

                case 'generate_image':
                    return generateImage(args.prompt, args.alt_text);

                case 'generate_edited_image':
                    return generateEditedImage(args.prompt, args.image_url, args.alt_text);

                case 'update_block':
                    return updateBlock({
                        blockId: args.block_id,
                        attributes: args.attributes,
                        style: args.style,
                        content: args.content
                    });

                case 'transform_block':
                    return transformBlock({
                        blockId: args.block_id,
                        targetBlockType: args.transform_to
                    });

                case 'wrap_block':
                    return wrapBlock({
                        blockId: args.block_id,
                        blockIds: args.block_ids,
                        wrapperBlockType: args.wrapper_block_type,
                        wrapperAttributes: args.wrapper_attributes,
                        columnWidths: args.column_widths
                    });

                case 'search_pattern':
                    return searchPattern({
                        search: args.search,
                        category: args.category
                    });

                case 'insert_pattern':
                    return insertPattern({
                        patternName: args.pattern_name,
                        position: args.position,
                        targetBlockId: args.relative_to_block_id
                    });

                case 'get_available_blocks':
                     return getAvailableBlocks(args.include_inactive, args.category);

                case 'get_block_schema':
                    return getBlockSchema(args.block_type);
                
                case 'undo':
                    return undo();
                
                case 'redo':
                    return redo();
                
                case 'search_media':
                    return searchMedia(args.search, args.media_type, args.per_page);
                
                case 'search_openverse':
                    return searchOpenverse(args.query, args.per_page, args.license);
                
                case 'upload_openverse_to_media':
                    return uploadOpenverseToMedia(
                        args.image_id,
                        args.image_url,
                        args.title,
                        args.creator,
                        args.creator_url,
                        args.license,
                        args.license_url
                    );
                
                case 'update_post_title':
                    return updatePostTitle(args.title);
                
                case 'update_post_excerpt':
                    return updatePostExcerpt(args.excerpt);
                
                case 'set_featured_image':
                    return setFeaturedImage(args.media_id);
                
                case 'remove_featured_image':
                    return removeFeaturedImage();

                case 'get_post_content':
                    return getPostContent(args.post_id, args.post_type, args.context);

                default:
                    throw new Error(`Unknown tool: ${name}`);
            }
        } catch (error) {
            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify({
                        success: false,
                        action: `${name}_execution_failed`,
                        error: `Error executing ${name}: ${error instanceof Error ? error.message : 'Unknown error'}`
                    })
                }]
            };
        }
    }
}
