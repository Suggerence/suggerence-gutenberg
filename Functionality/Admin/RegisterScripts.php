<?php

namespace SuggerenceGutenberg\Functionality\Admin;

use SuggerenceGutenberg\Components\ApiKeyEncryption;

class RegisterScripts
{

    protected $plugin_name;
    protected $plugin_version;

    public function __construct($plugin_name, $plugin_version)
    {
        $this->plugin_name = $plugin_name;
        $this->plugin_version = $plugin_version;

        add_action('admin_enqueue_scripts', [$this, 'register_scripts']);
    }

    public function register_scripts()
    {
        $suggerence_data = 'const SuggerenceData = ' . wp_json_encode([
            'suggerence_api_url' => 'https://api.suggerence.com/v1',
            'locale' => get_locale(),
            'nonce' => wp_create_nonce('wp_rest'),
            'wp_admin_dashboard_url' => admin_url('index.php'),
            'admin_ajax_url' => admin_url('admin-ajax.php'),
            'updates_nonce' => wp_create_nonce('updates'),
            'site_url' => home_url(),
            'has_kadence_blocks' => is_plugin_active('kadence-blocks/kadence-blocks.php'),
            'api_key_endpoint' => 'suggerence-gutenberg/settings/v1/suggerence-api-key',
            'api_key_remove_endpoint' => 'suggerence-gutenberg/settings/v1/suggerence-api-key/remove',
            'auth_login_endpoint' => 'suggerence-gutenberg/auth/v1/login',
            'auth_refresh_endpoint' => 'suggerence-gutenberg/auth/v1/refresh',
        ]) . ';';

        /**
         * Components
         */

        wp_register_style(
            $this->plugin_name . '-components',
            SUGGERENCEGUTENBERG_URL . 'build/style-components.css',
            ['wp-components'],
            $this->plugin_version,
        );

        /**
         * Gutenberg Editor
         */

        $asset_file = include(SUGGERENCEGUTENBERG_PATH . 'build/gutenberg-editor.asset.php');
        $script_dependencies = $asset_file['dependencies'];

        if (!in_array('code-editor', $script_dependencies, true)) {
            $script_dependencies[] = 'code-editor';
        }

        wp_register_script(
            $this->plugin_name . '-gutenberg-editor',
            SUGGERENCEGUTENBERG_URL . 'build/gutenberg-editor.js',
            $script_dependencies,
            $asset_file['version'],
            array(
                'in_footer' => true,
            )
        );

        wp_add_inline_script($this->plugin_name . '-gutenberg-editor', $suggerence_data);

        wp_register_style(
            $this->plugin_name . '-gutenberg-editor',
            SUGGERENCEGUTENBERG_URL . 'build/style-gutenberg-editor.css',
            [$this->plugin_name . '-components'],
            $asset_file['version'],
        );

        /**
         * API key settings
         */
        $settings_asset_file = include(SUGGERENCEGUTENBERG_PATH . 'build/api-key-settings.asset.php');

        wp_register_script(
            $this->plugin_name . '-api-key-settings',
            SUGGERENCEGUTENBERG_URL . 'build/api-key-settings.js',
            $settings_asset_file['dependencies'],
            $settings_asset_file['version'],
            [
                'in_footer' => true,
            ]
        );

        wp_add_inline_script($this->plugin_name . '-api-key-settings', $suggerence_data);

        wp_register_style(
            $this->plugin_name . '-api-key-settings',
            SUGGERENCEGUTENBERG_URL . 'build/style-api-key-settings.css',
            [$this->plugin_name . '-components'],
            $settings_asset_file['version']
        );

        /**
         * Block generator
         */
        $asset_file = include(SUGGERENCEGUTENBERG_PATH . 'build/block-generator.asset.php');

        $result = wp_register_script(
            $this->plugin_name . '-block-generator',
            SUGGERENCEGUTENBERG_URL . 'build/block-generator.js',
            $script_dependencies,
            $asset_file['version'],
            ['in_footer' => true]
        );

        wp_register_style(
            $this->plugin_name . '-block-generator',
            SUGGERENCEGUTENBERG_URL . 'build/style-block-generator.css',
            [$this->plugin_name . '-components'],
            $this->plugin_version
        );

        // wp_add_inline_script($this->plugin_name . '-block-generator', $suggerence_data);

        /**
         * Theme editor
         */
        $asset_file = include(SUGGERENCEGUTENBERG_PATH . 'build/theme-editor.asset.php');

        wp_register_script(
            $this->plugin_name . '-theme-editor',
            SUGGERENCEGUTENBERG_URL . 'build/theme-editor.js',
            $asset_file['dependencies'],
            $asset_file['version'],
            ['in_footer' => true]
        );

        wp_register_style(
            $this->plugin_name . '-theme-editor',
            SUGGERENCEGUTENBERG_URL . 'build/style-theme-editor.css',
            [$this->plugin_name . '-components'],
            $asset_file['version']
        );

        wp_add_inline_script($this->plugin_name . '-theme-editor', $suggerence_data);
    }
}
