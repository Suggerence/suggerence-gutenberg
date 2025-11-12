<?php

namespace SuggerenceGutenberg\Functionality\Admin;

/**
 * Gutenberg Editor Integration
 * Integrates Suggerence functionality with the WordPress Gutenberg editor
 */
class EditorCommands
{
    protected $plugin_name;
    protected $plugin_version;

    public function __construct($plugin_name, $plugin_version)
    {
        $this->plugin_name = $plugin_name;
        $this->plugin_version = $plugin_version;

        add_action('enqueue_block_editor_assets', [$this, 'enqueue_editor_commands']);
    }

    /**
     * Enqueue the editor commands script
     */
    public function enqueue_editor_commands()
    {
        // Only load in the block editor
        if (!wp_should_load_block_editor_scripts_and_styles()) {
            return;
        }

        // Check if we're in the post editor
        $screen = get_current_screen();
        if (!$screen || !in_array($screen->id, ['post', 'page', 'edit-post'])) {
            return;
        }

        $code_editor_settings = wp_enqueue_code_editor([
            'type' => 'text/css',
        ]);

        if ($code_editor_settings) {
            wp_enqueue_script('wp-codemirror');
            wp_enqueue_style('wp-codemirror');

            wp_add_inline_script(
                $this->plugin_name . '-gutenberg-editor',
                'window.SuggerenceCustomCssEditorSettings = ' . wp_json_encode($code_editor_settings) . ';',
                'before'
            );
        }

        // Enqueue the gutenberg editor script
        wp_enqueue_script($this->plugin_name . '-gutenberg-editor');
        wp_enqueue_style($this->plugin_name . '-gutenberg-editor');
    }
}
