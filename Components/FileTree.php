<?php

namespace SuggerenceGutenberg\Components;

use SuggerenceGutenberg\Entities\FolderNode;
use SuggerenceGutenberg\Entities\FileNode;
use SuggerenceGutenberg\Entities\File;
use SuggerenceGutenberg\Entities\Node;

class FileTree
{
    private const IGNORED_FILES = [
        '.',
        '..',
        Block::BLOCKS_DEFINITION_FILE
    ];

    /**
     * Builds the file tree node objects from an array
     * 
     * @param array $files Array of files with keys: status, content, path, filename, extension
     * @return Node[]
     */
    public static function build_file_tree_from_array( $files )
    {
        // Build a tree structure using associative arrays
        $tree = [];

        foreach ( $files as $file ) {
            // Parse the path (e.g., './src/block.json' -> ['src', 'block.json'])
            $path = $file['path'];
            $path = ltrim( $path, './' ); // Remove leading './'
            $path_parts = explode( '/', $path );
            
            // Navigate/create the folder structure
            $current = &$tree;
            $current_path = './';
            
            // Process all parts except the last one (which is the filename)
            for ( $i = 0; $i < count( $path_parts ) - 1; $i++ ) {
                $folder_name = $path_parts[$i];
                $current_path .= ( $current_path === './' ? '' : '/' ) . $folder_name;
                
                if ( !isset( $current[$folder_name] ) ) {
                    $current[$folder_name] = [
                        'type' => 'folder',
                        'name' => $folder_name,
                        'path' => $current_path,
                        'children' => []
                    ];
                }
                
                $current = &$current[$folder_name]['children'];
            }
            
            // Add the file to the current location
            $filename = $path_parts[count( $path_parts ) - 1];
            $current[$filename] = [
                'type' => 'file',
                'name' => $filename,
                'path' => $file['path'],
                'file_data' => $file
            ];
        }

        // Convert the tree structure to Node objects
        return self::convert_tree_to_nodes( $tree );
    }

    /**
     * Converts the tree structure to Node objects
     * 
     * @param array $tree
     * @return Node[]
     */
    private static function convert_tree_to_nodes( $tree )
    {
        $nodes = [];

        foreach ( $tree as $item ) {
            if ( $item['type'] === 'file' ) {
                $file_data = $item['file_data'];
                $file = new File(
                    $file_data['content'],
                    $file_data['path'],
                    $file_data['filename'],
                    $file_data['extension'],
                    $file_data['status'] ?? 'completed'
                );
                $nodes[] = new FileNode( $item['name'], $item['path'], $file );
            }
            elseif ( $item['type'] === 'folder' ) {
                $children = self::convert_tree_to_nodes( $item['children'] );
                $nodes[] = new FolderNode( $item['name'], $item['path'], $children );
            }
        }

        return $nodes;
    }

    /**
     * Builds the file tree for a block
     * 
     * @param string $block_id
     * @return Node[]
     */
    public static function build_block_file_tree( $block_id )
    {
        $block = new Block( $block_id );
        
        if ( !$block->has_root_folder() ) {
            return [];
        }

        return self::build_file_tree_recursive( $block->root(), $block->root() );
    }

    /**
     * Flattens the file tree into a single array
     * @param (FileNode|FolderNode)[] $nodes
     * @return FileNode[]
     */
    public static function flatten( $nodes )
    {
        $files = [];

        foreach ( $nodes as $node ) {
            if ( $node->get_type() === Node::TYPE_FILE ) {
                $files[] = $node;
            }
            elseif ( $node->get_type() === Node::TYPE_FOLDER && !empty( $node->get_children() ) ) {
                $files = array_merge( $files, self::flatten( $node->get_children() ) );
            }
        }

        return $files;
    }

    /**
     * Converts the file tree to an array
     * @param (FileNode|FolderNode)[] $nodes
     * @return array
     */
    public static function to_array( $nodes )
    {
        $array = [];
        
        foreach ( $nodes as $node ) {
            $array[] = $node->to_array();
        }
        
        return $array;
    }

    /**
     * Builds the file tree recursively
     * 
     * @param string $base_path
     * @param string $current_path
     * @return Node[]
     */
    private static function build_file_tree_recursive( $base_path, $current_path )
    {
        $nodes = [];

        if ( !is_dir( $current_path ) ) {
            return $nodes;
        }

        $entries = scandir( $current_path );
        if ( $entries === false ) {
            return $nodes;
        }

        sort( $entries );

        foreach ( $entries as $entry ) {
            if ( in_array( $entry, self::IGNORED_FILES ) ) {
                continue;
            }

            $full_path = $current_path . '/' . $entry;

            // Calculate the relative path
            $base_path_normalized = rtrim( str_replace( '\\', '/', $base_path ), '/' );
            $full_path_normalized = str_replace( '\\', '/', $full_path );
            $relative_path = str_replace( $base_path_normalized . '/', '', $full_path_normalized );

            // Ensure the path starts with './'
            $clean_path = './' . ltrim( $relative_path, './' );

            if ( is_dir( $full_path ) ) {
                $children = self::build_file_tree_recursive( $base_path, $full_path );

                $nodes[] = new FolderNode( $entry, $clean_path, $children );
            }
            else {
                $content = file_get_contents( $full_path );
                if ( $content === false ) {
                    continue;
                }

                $extension = pathinfo( $entry, PATHINFO_EXTENSION );
                
                $file = new File( $content, $clean_path, $entry, $extension );
                
                $nodes[] = new FileNode( $entry, $clean_path, $file );
            }
        }

        return $nodes;
    }
}
