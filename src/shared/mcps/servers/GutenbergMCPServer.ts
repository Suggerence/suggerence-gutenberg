import {
    addBlockTool,
    moveBlockTool,
    duplicateBlockTool,
    deleteBlockTool,
    selectBlockTool,
    updateBlockContentTool,
    addBlock,
    moveBlock,
    duplicateBlock,
    deleteBlock,
    selectBlock,
    updateBlockContent,
    insertBlockAfter
} from '@/shared/mcps/tools/block-manipulation';
import {
    getBlocksInfoTool,
    getSelectedBlockInfoTool,
    getBlocksInfo,
    getSelectedBlockInfo
} from '@/shared/mcps/tools/block-info';
import {
    generateImageTool,
    generateImageWithInputsTool,
    generateEditedImageTool,
    generateImage,
    generateImageWithInputs,
    generateEditedImage
} from '@/shared/mcps/tools/image-generation';
import {
    generateBlocksFromCanvasTool,
    generateBlocksFromCanvas
} from '@/shared/mcps/tools/canvas-to-blocks';
import {
    getAvailableBlocksTool,
    getBlockSchemaTool,
    getAvailableBlocks,
    getBlockSchema
} from '@/shared/mcps/tools/block-schema';

export class GutenbergMCPServer {
    static initialize(): SuggerenceMCPServerConnection {
        return {
            name: 'gutenberg',
            title: 'Gutenberg Editor',
            description: 'Frontend MCP server for Gutenberg block editor operations',
            protocol_version: '1.0.0',
            endpoint_url: 'http://localhost:3000',
            is_active: true,
            type: 'frontend',
            connected: true,
            client: new GutenbergMCPServer(),
            id: 1,
            capabilities: '',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        }
    }

    private tools: SuggerenceMCPResponseTool[] = [
        addBlockTool,
        moveBlockTool,
        duplicateBlockTool,
        deleteBlockTool,
        selectBlockTool,
        updateBlockContentTool,
        generateImageTool,
        generateImageWithInputsTool,
        generateEditedImageTool,
        getBlocksInfoTool,
        getSelectedBlockInfoTool,
        generateBlocksFromCanvasTool,
        getAvailableBlocksTool,
        getBlockSchemaTool
    ];

    listTools(): { tools: SuggerenceMCPResponseTool[] } {
        return {
            tools: this.tools
        };
    }

    async callTool(params: { name: string, arguments: Record<string, any> }): Promise<{ content: Array<{ type: string, text: string }> }> {
        const { name, arguments: args } = params;

        try {
            switch (name) {
                case 'add_block':
                    return addBlock(args.blockType, args.attributes, args.position, args.targetBlockId);

                case 'move_block':
                    return moveBlock(args.position, args.blockId);

                case 'duplicate_block':
                    return duplicateBlock(args.blockId);

                case 'delete_block':
                    return deleteBlock(args.blockId);

                case 'generate_image':
                    return generateImage(args.prompt, args.alt_text);

                case 'generate_image_with_inputs':
                    return generateImageWithInputs(args.prompt, args.input_images, args.alt_text);

                case 'generate_edited_image':
                    return generateEditedImage(args.prompt, args.image_url, args.alt_text);

                case 'select_block':
                    return selectBlock(args.blockId);

                case 'update_block_content':
                    return updateBlockContent(args.blockId, args.content);

                case 'get_blocks_info':
                    return getBlocksInfo(args.includeContent);

                case 'get_selected_block_info':
                    return getSelectedBlockInfo();

                case 'insert_block_after':
                    return insertBlockAfter(args.blockType, args.afterBlockId);

                case 'generate_blocks_from_canvas':
                    return generateBlocksFromCanvas(args.blockStructure, args.analysis, args.replaceExisting, args.targetPosition);

                case 'get_available_blocks':
                    return getAvailableBlocks(args.includeInactive, args.category);

                case 'get_block_schema':
                    return getBlockSchema(args.blockType);

                default:
                    throw new Error(`Unknown tool: ${name}`);
            }
        } catch (error) {
            return {
                content: [{
                    type: 'text',
                    text: `Error executing ${name}: ${error instanceof Error ? error.message : 'Unknown error'}`
                }]
            };
        }
    }
}