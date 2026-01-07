<?php

namespace SuggerenceGutenberg\Functionality\Endpoints;

use SuggerenceGutenberg\Functionality\BaseApiEndpoints;

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

    }

    public function update_style()
    {
        
    }
}
