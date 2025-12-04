<?php

namespace SuggerenceGutenberg\Functionality;

use SuggerenceGutenberg\Components\Block;

class BlockRegistry
{
    protected $plugin_name;
    protected $plugin_version;

    public function __construct( $plugin_name, $plugin_version )
    {
        $this->plugin_name = $plugin_name;
        $this->plugin_version = $plugin_version;

        add_action( 'init', [ $this, 'register_blocks' ], 20 );
        add_action( 'enqueue_block_editor_assets', [ $this, 'enqueue_block_scripts' ] );
        add_action( 'wp_enqueue_scripts', [ $this, 'enqueue_block_view_scripts' ] );
    }

    private function get_block_directories()
    {
        $block_directories = [];

        if ( !is_readable( Block::BLOCKS_FOLDER ) ) {
            return $block_directories;
        }

        $entries = scandir( Block::BLOCKS_FOLDER );
        if ( $entries === false ) {
            return $block_directories;
        }

        foreach ( $entries as $entry ) {
            if ( in_array( $entry, [ '.', '..' ] ) ) {
                continue;
            }

            $block_path = Block::BLOCKS_FOLDER . '/' . $entry;

            if ( !is_dir( $block_path ) ) {
                continue;
            }

            $block = new Block( $entry );
            if ( $block->file_exists( Block::BLOCKS_BUILD_FILE_PATH ) ) {
                $block_directories[] = $block_path;
            }

        }

        return $block_directories;
    }

    private function register_block( $block_directory )
    {
        // Extract block ID from the full directory path
        $block_id = basename( $block_directory );
        $block = new Block( $block_id );

        $block_json = $block->read_file( Block::BLOCKS_BUILD_FILE_PATH );
        if ( $block_json === false ) {
            $block_json_path = $block->file_path( Block::BLOCKS_BUILD_FILE_PATH );
            error_log( 'Failed to read block.json file: ' . $block_json_path . ' (block directory: ' . $block_directory . ')' );
            return;
        }

        $block_data = json_decode( $block_json, true );
        if ( $block_data === null || json_last_error() !== JSON_ERROR_NONE ) {
            error_log( 'Failed to decode block.json file: ' . $block_directory . ' - ' . json_last_error_msg() );
            return;
        }

        // Verify block name is set
        if ( empty( $block_data['name'] ?? null ) ) {
            error_log( 'Block name is not set: ' . $block_directory );
            return;
        }

        // Ensure style properties are present in block.json
        $original_json_string   = wp_json_encode( $block_data, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE );
        $block_data             = $this->ensure_style_properties( $block_data, $block );
        $updated_json_string    = wp_json_encode( $block_data, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE );

        // If block.json was updated, write it back to the file
        if ( $original_json_string !== $updated_json_string ) {
            $block->make_file( Block::BLOCKS_BUILD_FILE_PATH, $updated_json_string );
        }

        $result = register_block_type( $block->file_path( Block::BLOCKS_BUILD_FOLDER ) );

        if ( !$result ) {
            error_log( 'Failed to register block: ' . $block_directory . ' - ' . json_last_error_msg() );
            return;
        }

        return true;
    }

    private function ensure_style_properties( $block_data, $block )
    {
        if ( empty( $block_data['editorScript'] ) && $block->file_exists( Block::BLOCKS_BUILD_FOLDER . '/' . 'index.js' ) ) {
            $block_data['editorScript'] = 'file:./index.js';
        }

        if ( empty( $block_data['editorStyle'] ) && $block->file_exists( Block::BLOCKS_BUILD_FOLDER . '/' . 'index.css' ) ) {
            $block_data['editorStyle'] = 'file:./index.css';
        }

        if ( empty( $block_data['style'] ) && $block->file_exists( Block::BLOCKS_BUILD_FOLDER . '/' . 'style-index.css' ) ) {
            $block_data['style'] = 'file:./style-index.css';
        }

        if ( empty( $block_data['viewScript'] ) && $block->file_exists( Block::BLOCKS_BUILD_FOLDER . '/' . 'view.js' ) ) {
            $block_data['viewScript'] = 'file:./view.js';
        }

        if ( empty( $block_data['render'] ) && $block->file_exists( Block::BLOCKS_BUILD_FOLDER . '/' . 'render.php' ) ) {
            $block_data['render'] = 'file:./render.php';
        }

        return $block_data;
    }

    public function register_blocks()
    {
        if ( !file_exists( Block::BLOCKS_FOLDER ) ) {
            return;
        }

        $block_directories = $this->get_block_directories();

        foreach ( $block_directories as $block_directory ) {
            $this->register_block( $block_directory );
        }
    }

    /**
     * Enqueue scripts for all registered blocks
     */
    public function enqueue_block_scripts()
    {
        // Only load in the block editor
        if ( !wp_should_load_block_editor_scripts_and_styles() ) {
            return;
        }

        if ( !file_exists( Block::BLOCKS_FOLDER ) ) {
            return;
        }

        $block_directories = $this->get_block_directories();

        foreach ( $block_directories as $block_directory ) {
            $block_id = basename( $block_directory );
            $block = new Block( $block_id );

            // Enqueue index.js if it exists
            if ( $block->file_exists( Block::BLOCKS_BUILD_FOLDER . '/' . 'index.js' ) ) {
                $script_url = WP_CONTENT_URL . '/blocks/' . $block_id . '/' . Block::BLOCKS_BUILD_FOLDER . '/index.js';
                $script_handle = 'suggerence-block-' . $block_id;

                // Get file modification time for versioning
                $script_path = $block->file_path( Block::BLOCKS_BUILD_FOLDER . '/' . 'index.js' );
                $script_version = file_exists( $script_path ) ? filemtime( $script_path ) : $this->plugin_version;

                wp_enqueue_script(
                    $script_handle,
                    $script_url,
                    [ 'wp-blocks', 'wp-element', 'wp-editor', 'wp-components', 'wp-i18n' ],
                    $script_version,
                    true
                );
            }
        }
    }

    /**
     * Enqueue view scripts for all registered blocks on the frontend
     */
    public function enqueue_block_view_scripts()
    {
        // Only load on frontend, not in editor
        if ( is_admin() || wp_should_load_block_editor_scripts_and_styles() ) {
            return;
        }

        if ( !file_exists( Block::BLOCKS_FOLDER ) ) {
            return;
        }

        $block_directories = $this->get_block_directories();

        foreach ( $block_directories as $block_directory ) {
            $block_id = basename( $block_directory );
            $block = new Block( $block_id );

            // Check if view.js exists
            if ( $block->file_exists( Block::BLOCKS_BUILD_FOLDER . '/' . 'view.js' ) ) {
                $script_url = WP_CONTENT_URL . '/blocks/' . $block_id . '/' . Block::BLOCKS_BUILD_FOLDER . '/view.js';
                $script_handle = 'suggerence-block-view-' . $block_id;

                // Get file modification time for versioning
                $script_path = $block->file_path( Block::BLOCKS_BUILD_FOLDER . '/' . 'view.js' );
                $script_version = file_exists( $script_path ) ? filemtime( $script_path ) : $this->plugin_version;

                wp_enqueue_script(
                    $script_handle,
                    $script_url,
                    [], // No dependencies by default, but view.js can declare its own
                    $script_version,
                    true // Load in footer
                );
            }
        }
    }
}
