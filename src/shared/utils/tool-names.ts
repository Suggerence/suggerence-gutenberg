import { __ } from '@wordpress/i18n';

/**
 * Map of tool names to their translatable display names
 * This allows showing user-friendly names in the UI instead of technical identifiers
 */
export const getToolDisplayNames = (): Record<string, string> => ({
    // Block manipulation tools
    'add_block': __('Add block', 'suggerence'),
    'move_block': __('Move block', 'suggerence'),
    'duplicate_block': __('Duplicate block', 'suggerence'),
    'delete_block': __('Delete block', 'suggerence'),
    'update_block': __('Update block', 'suggerence'),
    'transform_block': __('Transform block', 'suggerence'),
    'wrap_block': __('Wrap block', 'suggerence'),
    'undo': __('Undo', 'suggerence'),
    'redo': __('Redo', 'suggerence'),

    // Block schema tools
    'get_available_blocks': __('Get available blocks', 'suggerence'),
    'get_block_schema': __('Get block schema', 'suggerence'),

    // Image generation tools
    'generate_image': __('Generate image', 'suggerence'),
    'generate_edited_image': __('Edit image', 'suggerence'),
    'generate_blocks_from_canvas': __('Generate blocks from canvas', 'suggerence'),

    // Pattern tools
    'search_pattern': __('Search patterns', 'suggerence'),
    'insert_pattern': __('Insert pattern', 'suggerence'),

    // Media library tools
    'search_media': __('Search media library', 'suggerence'),
    'get_media_details': __('Get media details', 'suggerence'),
    'search_openverse': __('Search Openverse', 'suggerence'),
    'insert_openverse_image': __('Insert Openverse image', 'suggerence'),

    // Document tools
    'get_document_structure': __('Get document structure', 'suggerence'),
    'search_blocks_by_content': __('Search blocks', 'suggerence'),
    'get_post_metadata': __('Get post metadata', 'suggerence'),
    'update_post_title': __('Update post title', 'suggerence'),
    'update_post_excerpt': __('Update post excerpt', 'suggerence'),
    'set_featured_image': __('Set featured image', 'suggerence'),
    'remove_featured_image': __('Remove featured image', 'suggerence'),
});

/**
 * Get a translatable display name for a tool
 * @param toolName The technical tool name (e.g., "add_block")
 * @returns The translated user-friendly name (e.g., "Add block" or "Añadir bloque")
 */
export const getToolDisplayName = (toolName: string): string => {
    // Remove server prefix if present (e.g., "gutenberg___add_block" -> "add_block")
    const cleanToolName = toolName?.replace(/^[^_]*___/, '') || toolName;
    
    const toolNames = getToolDisplayNames();
    
    // Return translated name if available, otherwise return cleaned tool name
    return toolNames[cleanToolName] || cleanToolName || __('Unknown Tool', 'suggerence');
};

