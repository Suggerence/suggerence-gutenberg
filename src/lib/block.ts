import { __ } from '@wordpress/i18n';

export const getAllDocuments = () =>
{
    const documents: Document[] = [document];

    const editorCanvas = document.querySelector('iframe[name="editor-canvas"]');
    const iframeDocument = editorCanvas ? (editorCanvas as HTMLIFrameElement).contentDocument : null;

    if (iframeDocument) documents.push(iframeDocument);

    return documents;
}

export const getBlockFile = async (generatedBlock: Partial<GeneratedBlock>, filePath: string) =>
{
    if (!generatedBlock) return { success: false, message: __('Block not found', 'suggerence-blocks') };

    if (!generatedBlock.src_files || generatedBlock.src_files.length === 0) return { success: false, message: __('Block has no files', 'suggerence-blocks') };

    // Normalize the path, remove leading "./" if present
    const normalizedPath = filePath.replace(/^\.\//, '');

    // Find the file in the src_files - prioritize exact path match
    // First try exact path match
    let file = generatedBlock.src_files.find(file =>
    {
        const filePath = file.path ?? file.filename;
        const cleanFilePath = filePath.replace(/^\.\//, '');
        return cleanFilePath === normalizedPath;
    });

    // Only if exact path match fails and the requested path has no directory (just a filename),
    // then try filename-only match as fallback
    if (!file && !normalizedPath.includes('/')) {
        file = generatedBlock.src_files.find(file =>
        {
            return file.filename === normalizedPath;
        });
    }

    if (!file) return { success: false, message: __('File not found', 'suggerence-blocks') + ': ' + filePath };

    return { success: true, message: __('Block file found', 'suggerence-blocks') + ': ' + filePath, data: file };
}

export const loadStyleIntoDocument = (document: Document, styleId: string, styleContent: string) =>
{
    const existingStyle = document.getElementById(styleId);
    if (existingStyle) existingStyle.remove();

    const styleElement = document.createElement('style');
    styleElement.id = styleId;
    styleElement.textContent = styleContent;
    document.head.appendChild(styleElement);

    return styleElement;
}

export const loadBlockStyle = async (generatedBlock: Partial<GeneratedBlock>, styleContent: string, target: 'editor' | 'view') =>
{
    const styleId = `${generatedBlock?.slug || generatedBlock?.id || 'unknown'}-${target}-css`;

    // Get all relevant documents (main document + editor iframe if exists)
    const documents = getAllDocuments();

    // Load styles into all documents
    const styleElements = documents.map(document => loadStyleIntoDocument(document, styleId, styleContent));

    return { success: true, message: __('Block style loaded into documents', 'suggerence-blocks'), data: styleElements };
}

export const executeBlockRegistrationCode = async (code: string) =>
{
    try {
        (0, eval)(code);
        return { success: true, message: __('Block registration code executed successfully', 'suggerence-blocks') };
    } catch (error: unknown) {
        console.error('[executeBlockRegistrationCode] Error executing code', { code, error });
        return { success: false, message: __('Error executing block registration code', 'suggerence-blocks') + ': ' + (error instanceof Error ? error.message : String(error ?? 'Unknown error')) };
    }
}

export const loadBlockIntoEditor = async (generatedBlock: Partial<GeneratedBlock>) =>
{
    if (!generatedBlock) return { success: false, message: __('Block not found', 'suggerence-blocks') };

    // Parse block json
    const blockJson = await getBlockFile(generatedBlock, './src/block.json');
    if (!blockJson.success) return blockJson;

    const blockJsonData = JSON.parse(blockJson.data?.content ?? '{}');

    // Make block metadata available globally before loading index.js
    if (!(window as any).__blockMetadata) (window as any).__blockMetadata = {};
    (window as any).__blockMetadata[generatedBlock.slug || generatedBlock.id || 'unknown'] = blockJsonData;

    // Load editor styles if available
    const editorStyles = await getBlockFile(generatedBlock, './build/index.css');
    if (editorStyles.success) {
        await loadBlockStyle(generatedBlock, editorStyles.data?.content ?? '', 'editor');
    }

    // Load frontend styles if available
    const frontendStyles = await getBlockFile(generatedBlock, './build/style-index.css');
    if (frontendStyles.success) {
        await loadBlockStyle(generatedBlock, frontendStyles.data?.content ?? '', 'view');
    }

    // Unregister block first to avoid "already registered" errors
    const wp = (window as any).wp;
    const blockSlug = generatedBlock.slug || generatedBlock.id || 'unknown';
    const fullBlockName = `suggerence/${blockSlug}`;

    wp.blocks.unregisterBlockType(fullBlockName);

    // Execute the block registration code
    const indexJs = await getBlockFile(generatedBlock, './build/index.js');
    if (indexJs.success) {
        const executionResult = await executeBlockRegistrationCode(indexJs.data?.content ?? '');
        if (!executionResult.success) {
            return executionResult;
        }
    }

    let block = wp?.blocks?.getBlockType(fullBlockName);

    if (!block) return { success: false, message: __('Block not found. Make sure that you pass a title when you call registerBlockType', 'suggerence-blocks') };

    const updatedMetadata = {
        ...block,
        apiVersion: blockJsonData.apiVersion || 3,
        title: blockJsonData.title || block.title,
        description: blockJsonData.description || block.description,
        icon: blockJsonData.icon || block.icon,
        category: blockJsonData.category || block.category,
        attributes: blockJsonData.attributes || block.attributes,
        supports: blockJsonData.supports || block.supports,
        keywords: blockJsonData.keywords || block.keywords
    };

    wp.blocks.registerBlockType(fullBlockName, updatedMetadata);

    return { success: true, message: __('Block loaded successfully', 'suggerence-blocks'), data: block };
}

/**
 * Builds a file tree structure from an array of files
 * Similar to PHP's FileTree::build_file_tree_from_array
 * 
 * @param files Array of GeneratedFile objects
 * @returns FileTreeNode[] representing the tree structure
 */
export const buildFileTreeFromArray = (files: GeneratedFile[]): FileTreeNode[] => {
    // Build a tree structure using a map
    interface TreeItem {
        type: 'file' | 'folder';
        name: string;
        path: string;
        file?: GeneratedFile;
        children?: Map<string, TreeItem>;
    }

    const tree = new Map<string, TreeItem>();

    for (const file of files) {
        const filePath = file.path ?? file.filename;
        if (!filePath) continue;

        // Parse the path (e.g., './src/block.json' -> ['src', 'block.json'])
        const cleanPath = filePath.replace(/^\.\//, '');
        const pathParts = cleanPath.split('/');

        // Navigate/create the folder structure
        let current = tree;
        let currentPath = './';

        // Process all parts except the last one (which is the filename)
        for (let i = 0; i < pathParts.length - 1; i++) {
            const folderName = pathParts[i];
            currentPath += (currentPath === './' ? '' : '/') + folderName;

            if (!current.has(folderName)) {
                current.set(folderName, {
                    type: 'folder',
                    name: folderName,
                    path: currentPath,
                    children: new Map()
                });
            }

            const folder = current.get(folderName)!;
            if (!folder.children) {
                folder.children = new Map();
            }
            current = folder.children;
        }

        // Add the file to the current location
        const filename = pathParts[pathParts.length - 1];
        current.set(filename, {
            type: 'file',
            name: filename,
            path: filePath,
            file
        });
    }

    // Convert the tree structure to FileTreeNode array
    const convertTreeToNodes = (items: Map<string, TreeItem>): FileTreeNode[] => {
        const nodes: FileTreeNode[] = [];

        // Sort entries for consistent ordering
        const sortedEntries = Array.from(items.entries()).sort(([a], [b]) => {
            const aIsFolder = items.get(a)?.type === 'folder';
            const bIsFolder = items.get(b)?.type === 'folder';
            
            // Folders come first, then files
            if (aIsFolder && !bIsFolder) return -1;
            if (!aIsFolder && bIsFolder) return 1;
            return a.localeCompare(b);
        });

        for (const [, item] of sortedEntries) {
            if (item.type === 'file' && item.file) {
                nodes.push({
                    type: 'file',
                    name: item.name,
                    path: item.path,
                    file: item.file
                } as FileNode);
            } else if (item.type === 'folder' && item.children) {
                nodes.push({
                    type: 'folder',
                    name: item.name,
                    path: item.path,
                    children: convertTreeToNodes(item.children)
                } as FolderNode);
            }
        }

        return nodes;
    };

    return convertTreeToNodes(tree);
};