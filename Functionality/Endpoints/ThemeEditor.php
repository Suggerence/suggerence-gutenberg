<?php

namespace SuggerenceGutenberg\Functionality\Endpoints;

use SuggerenceGutenberg\Functionality\BaseApiEndpoints;
use SuggerenceGutenberg\Components\ChildTheme;
use PluboRoutes\Endpoint\GetEndpoint;
use PluboRoutes\Endpoint\PostEndpoint;

class ThemeEditor extends BaseApiEndpoints
{
    public function __construct($plugin_name, $plugin_version)
    {
        parent::__construct($plugin_name, $plugin_version, 'suggerence-theme-editor/v1');
    }

    public function define_endpoints()
    {
        return [
            new GetEndpoint(
                $this->namespace,
                'styles',
                [ $this, 'get_styles' ],
                [ $this, 'admin_permissions_check' ]
            ),

            new PostEndpoint(
                $this->namespace,
                'styles',
                [ $this, 'update_style' ],
                [ $this, 'admin_permissions_check' ]
            ),

            new PostEndpoint(
                $this->namespace,
                'fonts/upload',
                [ $this, 'upload_font_asset' ],
                [ $this, 'admin_permissions_check' ]
            )
        ];
    }

    public function get_styles()
    {
        $styles_json = ChildTheme::get();
        $styles = json_decode($styles_json, true);
        return $styles !== null ? $styles : [];
    }

    public function update_style($request)
    {
        $params = $request->get_json_params();
        $path = sanitize_text_field($params['path'] ?? '');
        $value = sanitize_text_field($params['value'] ?? '');
        $block = sanitize_text_field($params['block'] ?? null);

        if (empty($path) || empty($value)) {
            return new \WP_Error( 'invalid_request', esc_html__( 'Missing required parameters', 'suggerence-theme-editor' ), [ 'status' => 400 ] );
        }

        ChildTheme::update($path, $value, $block);

        // Return the updated styles as decoded JSON
        $styles_json = ChildTheme::get();
        $styles = json_decode($styles_json, true);
        return $styles !== null ? $styles : [];
    }

    /**
     * Uploads a font asset file to the child theme's assets/fonts directory.
     * Accepts multipart/form-data with a 'file' field or binary data with X-Font-Filename header.
     */
    public function upload_font_asset($request)
    {
        // Try to get file from multipart/form-data upload
        $files = $request->get_file_params();
        $file_content = null;
        $filename = null;

        if (!empty($files) && isset($files['file'])) {
            $uploaded_file = $files['file'];
            
            if (isset($uploaded_file['error']) && $uploaded_file['error'] === UPLOAD_ERR_OK) {
                $filename = sanitize_file_name($uploaded_file['name']);
                $file_content = file_get_contents($uploaded_file['tmp_name']);
            }
        }

        // Fallback: try to get file from request body (for binary uploads)
        if (empty($file_content)) {
            $file_content = $request->get_body();
            $filename = sanitize_text_field($request->get_header('X-Font-Filename') ?? 'font.woff2');
        }
        
        if (empty($file_content)) {
            return new \WP_Error(
                'invalid_request',
                esc_html__('No file provided', 'suggerence-theme-editor'),
                ['status' => 400]
            );
        }

        if (empty($filename)) {
            $filename = 'font.woff2';
        }

        $relative_path = ChildTheme::saveFontAsset($filename, $file_content);
        if ($relative_path === false) {
            return new \WP_Error(
                'upload_failed',
                esc_html__('Failed to save font file', 'suggerence-theme-editor'),
                ['status' => 500]
            );
        }

        $font_url = ChildTheme::getFontAssetUrl($relative_path);
        if ($font_url === false) {
            return new \WP_Error(
                'url_generation_failed',
                esc_html__('Failed to generate font URL', 'suggerence-theme-editor'),
                ['status' => 500]
            );
        }

        return [
            'success' => true,
            'path' => $relative_path,
            'url' => $font_url
        ];
    }
}
