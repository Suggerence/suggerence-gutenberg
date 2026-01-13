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
}
