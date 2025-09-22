<?php

namespace SuggerenceGutenberg\Functionality;

use SuggerenceGutenberg\Functionality\Endpoints\AiProviders;

/**
 * Main API Endpoints coordinator
 * Manages all endpoint groups and provides common functionality
 */
class ApiEndpoints
{
    protected $plugin_name;
    protected $plugin_version;

    public function __construct($plugin_name, $plugin_version)
    {
        $this->plugin_name = $plugin_name;
        $this->plugin_version = $plugin_version;

        $this->initialize_endpoint_groups();
    }

    /**
     * Initialize all endpoint groups
     */
    private function initialize_endpoint_groups()
    {       
        // AI Providers endpoints
        new AiProviders($this->plugin_name, $this->plugin_version);
    }


}