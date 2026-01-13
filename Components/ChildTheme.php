<?php

namespace SuggerenceGutenberg\Components;

class ChildTheme
{
    private const CHILD_SLUG = 'suggerence';
    private const CHILD_NAME = 'Suggerence';

    private static function create()
    {
        $child_path     = get_theme_root() . '/' . self::CHILD_SLUG;
        $style_file     = $child_path . '/style.css';

        $active_theme   = wp_get_theme();
        $parent_theme   = $active_theme->get_stylesheet();

        // Theme already existing and active
        if ($parent_theme === self::CHILD_SLUG) {
            return;
        }
        
        if (!wp_mkdir_p($child_path)) {
            error_log( 'Failed to create child theme directory: ' . $child_path );
            return;
        }

        $style_content = "/*\n" .
        "Theme Name: " . self::CHILD_NAME . "\n" .
        "Template: " . $parent_theme . "\n" .
        "*/";

        if (!file_put_contents($style_file, $style_content)) {
            error_log( 'Failed to create style.css in: ' . $child_path );
            return;
        }
    }

    public static function setup()
    {
        $child_path     = get_theme_root() . '/' . self::CHILD_SLUG;
        $style_file     = $child_path . '/style.css';
        
        $active_theme   = wp_get_theme();
        $parent_theme   = $active_theme->get_stylesheet();

        $child_theme    = wp_get_theme( self::CHILD_SLUG );

        if (!$child_theme->exists()) {
            self::create();
        }
        else {
            if ($parent_theme !== self::CHILD_SLUG && $child_theme->get_template() !== $parent_theme) {
                $content = file_get_contents($style_file);
                if ($content === false) {
                    error_log( 'Failed to read style.css in: ' . $child_path );
                    return;
                }

                if (preg_match('/Template:\s*.*/', $content)) {
                    $content = preg_replace('/Template:\s*.*/', 'Template: ' . $parent_theme, $content);
                }
                else {
                    $content = preg_replace('/(Theme Name:\s*.*\n)/', "$1Template: $parent_theme\n", $content);
                }

                if (!file_put_contents($style_file, $content)) {
                    error_log( 'Failed to update style.css in: ' . $child_path );
                    return;
                }

                if (function_exists('wp_clean_themes_cache')) {
                    wp_clean_themes_cache();
                }
            }
        }
    }
    
    public static function get()
    {
        self::setup();

        $child_path         = get_theme_root() . '/' . self::CHILD_SLUG;
        $theme_json_path    = $child_path . '/theme.json';

        if (!file_exists($theme_json_path)) {
            return '{]';
        }

        $content = file_get_contents($theme_json_path);
        if ($content === false) {
            error_log( 'Failed to read theme.json in: ' . $child_path );
            return '{]';
        }

        $data = json_decode($content, true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            error_log( 'Failed to parse theme.json in: ' . $child_path );
            return '{]';
        }

        return json_encode($data, JSON_UNESCAPED_SLASHES);
    }

    public static function update($path, $value, $block = null)
    {
        self::setup();

        $child_path         = get_theme_root() . '/' . self::CHILD_SLUG;
        $theme_json_path    = $child_path . '/theme.json';

        if (file_exists($theme_json_path)) {
            $content = file_get_contents($theme_json_path);
            if ($content === false) {
                error_log( 'Failed to read theme.json in: ' . $child_path );
                return;
            }
         
            $data = json_decode($content, true);
            if (json_last_error() !== JSON_ERROR_NONE) {
                error_log( 'Failed to parse theme.json in: ' . $child_path );
                return;
            }
        }
        else {
            $data = ['version' => 3, 'styles' => []];
        }

        $full_path = 'styles';
        if ($block) {
            $full_path .= '.blocks.' . $block;
        }
        $full_path .= '.' . $path;

        $keys = explode('.', $full_path);
        $ref = &$data;

        foreach ($keys as $key) {
            if (!isset($ref[$key]) || !is_array($ref[$key])) {
                $ref[$key] = [];
            }
            $ref = &$ref[$key];
        }
        $ref = $value;

        $json = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
        if (!file_put_contents($theme_json_path, $json)) {
            error_log( 'Failed to write theme.json in: ' . $child_path );
            return;
        }

        if (function_exists('wp_clean_themes_cache')) {
            wp_clean_themes_cache();
        }
    }
}
