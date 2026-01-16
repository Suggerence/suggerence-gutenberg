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

    /**
     * Saves a font asset file to the child theme's assets/fonts directory.
     * @param string $filename The filename for the font file
     * @param string $file_content The binary content of the font file
     * @return string|false The relative path to the saved font file, or false on failure
     */
    public static function saveFontAsset($filename, $file_content)
    {
        self::setup();

        $child_path = get_theme_root() . '/' . self::CHILD_SLUG;
        $assets_path = $child_path . '/assets';
        $fonts_path = $assets_path . '/fonts';

        // Create assets/fonts directory if it doesn't exist
        if (!wp_mkdir_p($fonts_path)) {
            error_log('Failed to create fonts directory: ' . $fonts_path);
            return false;
        }

        // Sanitize filename to prevent directory traversal
        $sanitized_filename = sanitize_file_name($filename);
        if (empty($sanitized_filename)) {
            error_log('Invalid filename provided: ' . $filename);
            return false;
        }

        $file_path = $fonts_path . '/' . $sanitized_filename;

        // Write the file
        if (file_put_contents($file_path, $file_content) === false) {
            error_log('Failed to write font file: ' . $file_path);
            return false;
        }

        // Return relative path from child theme root
        return 'assets/fonts/' . $sanitized_filename;
    }

    /**
     * Gets the URL for a font asset file in the child theme.
     * @param string $relative_path The relative path from the child theme root (e.g., 'assets/fonts/font.woff2')
     * @return string|false The URL to the font file, or false on failure
     */
    public static function getFontAssetUrl($relative_path)
    {
        self::setup();

        $child_path = get_theme_root() . '/' . self::CHILD_SLUG;
        $file_path = $child_path . '/' . $relative_path;

        // Validate that the file exists and is within the child theme directory
        if (!file_exists($file_path)) {
            error_log('Font file does not exist: ' . $file_path);
            return false;
        }

        // Ensure the path is within the child theme directory (security check)
        $normalized_file_path = wp_normalize_path(realpath($file_path));
        $normalized_child_path = wp_normalize_path(realpath($child_path));

        if (!$normalized_file_path || strpos($normalized_file_path, $normalized_child_path) !== 0) {
            error_log('Font file path is outside child theme directory: ' . $file_path);
            return false;
        }

        // Get the relative path from child theme root
        $relative_path_from_root = str_replace($normalized_child_path . '/', '', $normalized_file_path);

        // Return the theme file URI
        return get_theme_file_uri($relative_path_from_root);
    }
}
