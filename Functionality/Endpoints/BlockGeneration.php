<?php

namespace SuggerenceGutenberg\Functionality\Endpoints;

use SuggerenceGutenberg\Functionality\BaseApiEndpoints;
use SuggerenceGutenberg\Components\Block;
use SuggerenceGutenberg\Components\FileTree;
use PluboRoutes\Endpoint\GetEndpoint;
use PluboRoutes\Endpoint\PostEndpoint;

class BlockGeneration extends BaseApiEndpoints
{
    public function __construct( $plugin_name, $plugin_version )
    {
        parent::__construct( $plugin_name, $plugin_version, 'suggerence-blocks/v1' );
    }

    public function define_endpoints()
    {
        $get_blocks_endpoint = new GetEndpoint(
            $this->namespace,
            'blocks',
            [ $this, 'get_blocks' ]
            // TODO: Add admin permissions check
        );

        $get_block_endpoint = new GetEndpoint(
            $this->namespace,
            'blocks/{blockId:uuid}',
            [ $this, 'get_block' ]
            // TODO: Add admin permissions check
        );

        $store_block_endpoint = new PostEndpoint(
            $this->namespace,
            'blocks',
            [ $this, 'store_block' ]
            // TODO: Add admin permissions check
        );

        $update_block_endpoint = new PostEndpoint(
            $this->namespace,
            'blocks/{blockId:uuid}/update',
            [ $this, 'update_block' ]
            // TODO: Add admin permissions check
        );

        $delete_block_endpoint = new PostEndpoint(
            $this->namespace,
            'blocks/{blockId:uuid}/delete',
            [ $this, 'delete_block' ]
            // TODO: Add admin permissions check
        );

        return [
            $get_blocks_endpoint,
            $get_block_endpoint,
            $store_block_endpoint,
            $update_block_endpoint,
            $delete_block_endpoint
        ];
    }

    /**
     * Get all blocks
     * @return array
     */
    public function get_blocks()
    {
        $blocks = [];
        
        if ( !file_exists( Block::BLOCKS_FOLDER ) ) {
            return $blocks;
        }

        $block_folders = scandir( Block::BLOCKS_FOLDER );

        foreach ( $block_folders as $block_folder ) {
            if ( in_array( $block_folder, [ '.', '..' ] ) ) {
                continue;
            }

            if ( !is_dir( Block::BLOCKS_FOLDER . '/' . $block_folder ) ) {
                continue;
            }

            $block              = new Block( $block_folder );
            $block_definition   = $block->get_definition();

            if ( $block_definition === false ) {
                continue;
            }

            // Remove lastBuildFileSnapshots from list response (only include it in single block response)
            unset( $block_definition['lastBuildFileSnapshots'] );

            $blocks[] = $block_definition;
        }

        return $blocks;
    }

    /**
     * Get all information from a single block
     * 
     * @param \WP_REST_Request $request
     * @return array
     */
    public function get_block( $request )
    {
        $params     = $request->get_params();
        $block_id   = sanitize_text_field( $params['blockId'] ?? '' );

        if ( empty( $block_id ) ) {
            return new \WP_Error( 'invalid_request', esc_html__( 'Block ID is required', 'suggerence-blocks' ), [ 'status' => 400 ] );
        }

        $block      = new Block( $block_id );
        $definition = $block->get_definition();

        if ( $definition === false ) {
            return new \WP_Error( 'block_not_found', esc_html__( 'Block not found', 'suggerence-blocks' ), [ 'status' => 404 ] );
        }

        $file_tree = FileTree::build_block_file_tree( $block_id );

        return array_merge( $definition, [
            'src_files' => FileTree::to_array( FileTree::flatten( $file_tree ) ),
            'file_tree' => FileTree::to_array( $file_tree )
        ] );
    }

    /**
     * Stores a new block
     * 
     * @param \WP_REST_Request $request
     * @return array
     */
    public function store_block( $request )
    {
        $params         = $request->get_params();

        $id             = sanitize_text_field( $params['id'] ?? '' );
        $description    = sanitize_text_field( $params['description'] ?? '' );
        $status         = sanitize_text_field( $params['status'] ?? '' );
        $date           = sanitize_text_field( $params['date'] ?? '' );
        $parent_id      = sanitize_text_field( $params['parent_id'] ?? null );

        if ( !$id || !$description || !$status || !$date ) {
            return new \WP_Error( 'invalid_request', esc_html__( 'Missing required parameters', 'suggerence-blocks' ), [ 'status' => 400 ] );
        }

        $block = new Block( $id );
        
        if ( !$block->define( $description, $status, $date, $parent_id ) ) {
            return new \WP_Error( 'failed_to_define_block', esc_html__( 'Failed to define block', 'suggerence-blocks' ), [ 'status' => 500 ] );
        }

        return [
            'success'   => true,
            'message'   => esc_html__( 'Block stored successfully' ),
            'block_id'  => $id
        ];
    }

    /**
     * Updates a block
     * 
     * @param \WP_REST_Request $request
     * @return array
     */
    public function update_block( $request )
    {
        $params         = $request->get_params();

        $block_id       = sanitize_text_field( $params['blockId'] ?? '' );
        $json_params    = $request->get_json_params();

        if ( empty( $block_id ) || empty( $json_params ) ) {
            return new \WP_Error( 'invalid_request', esc_html__( 'Missing required parameters', 'suggerence-blocks' ), [ 'status' => 400 ] );
        }

        // Check if block exists
        $block = new Block( $block_id );
        $definition = $block->get_definition();

        if ( $definition === false ) {
            return new \WP_Error( 'block_not_found', esc_html__( 'Block not found', 'suggerence-blocks' ), [ 'status' => 404 ] );
        }

        // Update definition - merge with existing values to preserve fields not being updated
        $result = $block->define(
            array_key_exists( 'description', $json_params ) ? $json_params['description'] : ( $definition['description'] ?? '' ),
            array_key_exists( 'status', $json_params ) ? $json_params['status'] : ( $definition['status'] ?? '' ),
            array_key_exists( 'date', $json_params ) ? $json_params['date'] : ( $definition['date'] ?? '' ),
            array_key_exists( 'parent_id', $json_params ) ? $json_params['parent_id'] : ( $definition['parent_id'] ?? null ),
            array_key_exists( 'slug', $json_params ) ? $json_params['slug'] : ( $definition['slug'] ?? null ),
            array_key_exists( 'title', $json_params ) ? $json_params['title'] : ( $definition['title'] ?? null ),
            array_key_exists( 'icon', $json_params ) ? $json_params['icon'] : ( $definition['icon'] ?? null ),
            array_key_exists( 'attributes', $json_params ) ? $json_params['attributes'] : ( $definition['attributes'] ?? null ),
            array_key_exists( 'version', $json_params ) ? $json_params['version'] : ( $definition['version'] ?? '1.0.0' ),
            array_key_exists( 'completed_at', $json_params ) ? $json_params['completed_at'] : ( $definition['completed_at'] ?? null ),
            array_key_exists( 'isRegistered', $json_params ) ? $json_params['isRegistered'] : ( $definition['isRegistered'] ?? null ),
            array_key_exists( 'lastBuildTime', $json_params ) ? $json_params['lastBuildTime'] : ( $definition['lastBuildTime'] ?? null ),
            array_key_exists( 'lastBuildFileSnapshots', $json_params ) ? $json_params['lastBuildFileSnapshots'] : ( $definition['lastBuildFileSnapshots'] ?? null )
        );

        if ( !$result ) {
            return new \WP_Error( 'failed_to_update_block', esc_html__( 'Failed to update block', 'suggerence-blocks' ), [ 'status' => 500 ] );
        }

        // Write files from src_files if provided
        if ( isset( $json_params['src_files'] ) && is_array( $json_params['src_files'] ) ) {

            $file_tree = FileTree::build_file_tree_from_array( $json_params['src_files'] );
            $files = FileTree::flatten( $file_tree );
            $result = $block->write_files( $files );

            if ( !$result ) {
                return new \WP_Error( 'failed_to_write_files', esc_html__( 'Failed to write files', 'suggerence-blocks' ), [ 'status' => 500 ] );
            }
        }

        return [
            'success' => true,
            'message' => esc_html__( 'Block updated successfully' ),
            'block_id' => $block_id
        ];
    }

    /**
     * Deletes a block
     * 
     * @param \WP_REST_Request $request
     * @return array
     */
    public function delete_block( $request )
    {
        $params     = $request->get_params();

        $block_id   = sanitize_text_field( $params['blockId'] ?? '' );

        if ( empty( $block_id ) ) {
            return new \WP_Error( 'invalid_request', esc_html__( 'Missing required parameters', 'suggerence-blocks' ), [ 'status' => 400 ] );
        }

        $block = new Block( $block_id );
        $result = $block->delete();

        if ( !$result ) {
            return new \WP_Error( 'failed_to_delete_block', esc_html__( 'Failed to delete block', 'suggerence-blocks' ), [ 'status' => 500 ] );
        }

        return [
            'success' => true,
            'message' => esc_html__( 'Block deleted successfully' ),
            'block_id' => $block_id
        ];
    }
}
