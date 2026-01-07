<?php

namespace SuggerenceGutenberg\Functionality;

use SuggerenceGutenberg\Functionality\Endpoints\Chat;
use SuggerenceGutenberg\Functionality\Endpoints\ApiKeySettings;
use SuggerenceGutenberg\Functionality\Endpoints\AuthTokens;
use SuggerenceGutenberg\Functionality\Endpoints\BlockGeneration;
use SuggerenceGutenberg\Functionality\Endpoints\ThemeEditor;
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
        // Chat endpoints
        new Chat($this->plugin_name, $this->plugin_version);

        // Block Generation endpoints
        new BlockGeneration($this->plugin_name, $this->plugin_version);

        // Theme Editor endpoints
        new ThemeEditor($this->plugin_name, $this->plugin_version);

        // API key settings
        new ApiKeySettings($this->plugin_name, $this->plugin_version);

        // Authentication helpers
        new AuthTokens($this->plugin_name, $this->plugin_version);
    }


}
