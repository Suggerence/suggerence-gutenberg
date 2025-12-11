<?php

namespace SuggerenceGutenberg\Functionality\Endpoints;

use SuggerenceGutenberg\Functionality\BaseApiEndpoints;
use PluboRoutes\Endpoint\PostEndpoint;
use PluboRoutes\Middleware\Cors;

use \WP_REST_Response;

/**
 * Chat endpoints
 * Handles Chat API requests
 */
class Chat extends BaseApiEndpoints
{
    public function __construct($plugin_name, $plugin_version)
    {
        parent::__construct($plugin_name, $plugin_version, 'suggerence-gutenberg/chat/v1');
    }

    /**
     * Define Chat endpoints
     */
    public function define_endpoints()
    {
        // CORS middleware for MCP client endpoints
        $corsMiddleware = new Cors('*', ['GET', 'POST', 'OPTIONS'], ['Content-Type', 'Authorization', 'X-Requested-With']);

        $openverse_sideload_endpoint = new PostEndpoint(
            $this->namespace,
            'openverse/sideload',
            [$this, 'sideload_openverse_image'],
            [$this, 'admin_permissions_check']
        );
        $openverse_sideload_endpoint->useMiddleware($corsMiddleware);

        return [
            $openverse_sideload_endpoint,
        ];
    }

    /**
     * Sideload (download and upload) an Openverse image to WordPress Media Library
     */
    public function sideload_openverse_image($request)
    {
        $params = $request->get_json_params();
        
        // Validate required parameters
        if (empty($params['image_url'])) {
            return new WP_REST_Response([
                'success' => false,
                'error' => 'Missing required parameter: image_url'
            ], 400);
        }

        $image_url = esc_url_raw($params['image_url']);
        $title = !empty($params['title']) ? sanitize_text_field($params['title']) : 'Openverse Image';
        $alt_text = !empty($params['alt_text']) ? sanitize_text_field($params['alt_text']) : '';
        $caption = '';
        $description = '';

        // Build attribution caption if creator/license info provided
        if (!empty($params['creator']) || !empty($params['license'])) {
            $attribution_parts = [];
            
            if (!empty($params['creator'])) {
                $creator = sanitize_text_field($params['creator']);
                if (!empty($params['creator_url'])) {
                    $creator_url = esc_url($params['creator_url']);
                    $attribution_parts[] = sprintf('<a href="%s">%s</a>', $creator_url, $creator);
                } else {
                    $attribution_parts[] = $creator;
                }
            }
            
            if (!empty($params['license'])) {
                $license = sanitize_text_field($params['license']);
                if (!empty($params['license_url'])) {
                    $license_url = esc_url($params['license_url']);
                    $attribution_parts[] = sprintf('<a href="%s">%s</a>', $license_url, $license);
                } else {
                    $attribution_parts[] = $license;
                }
            }
            
            if (!empty($attribution_parts)) {
                $caption = 'Photo by ' . implode(' / ', $attribution_parts);
            }
        }

        // Download the image from Openverse
        $response = wp_remote_get($image_url, [
            'timeout' => 30,
            'user-agent' => 'WordPress-Gutenberg-Assistant/1.0'
        ]);

        if (is_wp_error($response)) {
            return new WP_REST_Response([
                'success' => false,
                'error' => 'Failed to download image: ' . $response->get_error_message()
            ], 500);
        }

        $response_code = wp_remote_retrieve_response_code($response);
        if ($response_code !== 200) {
            return new WP_REST_Response([
                'success' => false,
                'error' => 'Failed to download image: HTTP ' . $response_code
            ], 500);
        }

        $image_data = wp_remote_retrieve_body($response);
        
        if (empty($image_data)) {
            return new WP_REST_Response([
                'success' => false,
                'error' => 'Empty image data received'
            ], 500);
        }

        // Determine file extension from URL or content type
        $content_type = wp_remote_retrieve_header($response, 'content-type');
        $extension = 'jpg'; // default
        
        if (strpos($content_type, 'image/png') !== false) {
            $extension = 'png';
        } elseif (strpos($content_type, 'image/jpeg') !== false || strpos($content_type, 'image/jpg') !== false) {
            $extension = 'jpg';
        } elseif (strpos($content_type, 'image/webp') !== false) {
            $extension = 'webp';
        } elseif (strpos($content_type, 'image/gif') !== false) {
            $extension = 'gif';
        }

        // Generate filename
        $filename = sanitize_file_name(substr($title, 0, 50)) . '_' . time() . '.' . $extension;
        
        // Upload the image using WordPress functions
        $uploaded_image = wp_upload_bits($filename, null, $image_data);

        if (!empty($uploaded_image['error'])) {
            return new WP_REST_Response([
                'success' => false,
                'error' => esc_html__('Failed to upload image: ', 'suggerence-gutenberg') . $uploaded_image['error']
            ], 500);
        }

        // Determine mime type
        $mime_type = 'image/jpeg';
        if ($extension === 'png') {
            $mime_type = 'image/png';
        } elseif ($extension === 'webp') {
            $mime_type = 'image/webp';
        } elseif ($extension === 'gif') {
            $mime_type = 'image/gif';
        }

        // Create WordPress attachment
        $attachment_data = [
            'post_mime_type' => $mime_type,
            'post_title' => $title,
            'post_content' => $description,
            'post_status' => 'publish',
            'post_author' => get_current_user_id()
        ];

        if (!empty($caption)) {
            $attachment_data['post_excerpt'] = $caption;
        }

        $attachment_id = wp_insert_attachment($attachment_data, $uploaded_image['file']);
        
        if (is_wp_error($attachment_id)) {
            return new WP_REST_Response([
                'success' => false,
                'error' => 'Failed to create attachment: ' . $attachment_id->get_error_message()
            ], 500);
        }

        // Set alt text
        if (!empty($alt_text)) {
            update_post_meta($attachment_id, '_wp_attachment_image_alt', $alt_text);
        }

        // Generate attachment metadata (thumbnails, etc.)
        require_once(ABSPATH . 'wp-admin/includes/image.php');
        $attachment_metadata = wp_generate_attachment_metadata($attachment_id, $uploaded_image['file']);
        wp_update_attachment_metadata($attachment_id, $attachment_metadata);

        $attachment_url = wp_get_attachment_url($attachment_id);

        return new WP_REST_Response([
            'success' => true,
            'message' => esc_html__('Openverse image uploaded successfully', 'suggerence-gutenberg'),
            'attachment_id' => $attachment_id,
            'image_url' => $attachment_url,
            'alt_text' => $alt_text,
            'caption' => $caption,
            'sizes' => $attachment_metadata['sizes'] ?? []
        ], 200);
    }
}
