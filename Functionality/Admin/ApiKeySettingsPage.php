<?php

namespace SuggerenceGutenberg\Functionality\Admin;

class ApiKeySettingsPage
{
    protected $plugin_name;
    protected $plugin_version;
    protected $page_hook;

    public function __construct($plugin_name, $plugin_version)
    {
        $this->plugin_name = $plugin_name;
        $this->plugin_version = $plugin_version;

        add_action('admin_menu', [$this, 'register_menu']);
        add_action('admin_enqueue_scripts', [$this, 'enqueue_scripts']);
    }

    public function register_menu()
    {
        $this->page_hook = add_options_page(
            esc_html__('Suggerence API Key', 'suggerence-gutenberg'),
            esc_html__('Suggerence API Key', 'suggerence-gutenberg'),
            'manage_options',
            'suggerence-api-key',
            [$this, 'render']
        );
    }

    public function enqueue_scripts($hook)
    {
        if ($hook !== $this->page_hook) {
            return;
        }

        wp_enqueue_script($this->plugin_name . '-api-key-settings');
        wp_enqueue_style($this->plugin_name . '-api-key-settings');
    }

    public function render()
    {
        ?>
        <div class="wrap">
            <h1><?php esc_html_e('Suggerence API Key', 'suggerence-gutenberg'); ?></h1>
            <div id="suggerence-api-key-settings"></div>
        </div>
        <?php
    }
}
