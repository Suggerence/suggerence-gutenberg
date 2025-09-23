import { TextBlockMCPServer } from './TextBlockMCPServer';
import { ImageBlockMCPServer } from './ImageBlockMCPServer';
import { ButtonBlockMCPServer } from './ButtonBlockMCPServer';
import { LayoutBlockMCPServer } from './LayoutBlockMCPServer';
import { GenericBlockMCPServer } from './GenericBlockMCPServer';

export class BlockSpecificMCPServerFactory {
    private static servers: Map<string, any> = new Map();

    static getServerForBlock(blockType: string): SuggerenceMCPServerConnection | null {
        // Initialize servers if not already done
        if (this.servers.size === 0) {
            this.initializeServers();
        }

        // Determine which server to use based on block type
        const serverKey = this.getServerKeyForBlockType(blockType);

        if (!serverKey) {
            return null; // No specific server for this block type
        }

        const serverClass = this.servers.get(serverKey);
        return serverClass ? serverClass.initialize() : null;
    }

    private static initializeServers() {
        // this.servers.set('text', TextBlockMCPServer);
        // this.servers.set('image', GenericBlockMCPServer);
        // this.servers.set('button', ButtonBlockMCPServer);
        // this.servers.set('layout', LayoutBlockMCPServer);
        this.servers.set('generic', GenericBlockMCPServer);
    }

    private static getServerKeyForBlockType(blockType: string): string | null {
        return 'generic';
        // Map block types to server categories
        const blockTypeMapping: Record<string, string> = {
            // Text blocks
            'core/paragraph': 'text',
            'core/heading': 'text',
            'core/quote': 'text',
            'core/code': 'text',
            'core/preformatted': 'text',
            'core/pullquote': 'text',
            'core/verse': 'text',

            // Image blocks
            'core/image': 'image',
            'core/gallery': 'image',
            'core/media-text': 'image',
            'core/query': 'image',

            // Button blocks
            'core/button': 'button',
            'core/buttons': 'button',

            // Layout blocks
            'core/group': 'layout',
            'core/columns': 'layout',
            'core/column': 'layout',
            'core/cover': 'layout',
            'core/spacer': 'layout',
            'core/separator': 'layout',

            // Add more mappings as needed
        };

        return blockTypeMapping[blockType] || null;
    }

    static getSupportedBlockTypes(): string[] {
        return [
            'core/paragraph',
            'core/heading',
            'core/quote',
            'core/code',
            'core/preformatted',
            'core/pullquote',
            'core/verse',
            'core/image',
            'core/gallery',
            'core/media-text',
            'core/button',
            'core/buttons',
            'core/group',
            'core/columns',
            'core/column',
            'core/cover',
            'core/spacer',
            'core/separator'
        ];
    }

    static isBlockSupported(blockType: string): boolean {
        return true;
        return this.getSupportedBlockTypes().includes(blockType);
    }

    static getAvailableCategories(): string[] {
        return ['text', 'image', 'button', 'layout'];
    }
}