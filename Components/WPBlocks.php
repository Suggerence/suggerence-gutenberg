<?php

namespace SuggerenceGutenberg\Components;

class WPBlocks
{
    private static function get_block_asset_url($path)
    {
        if (empty($path)) {
            return false;
        }

        // Path needs to be normalized to work in Windows env.
        static $wpinc_path_norm = '';
        if (! $wpinc_path_norm) {
            $wpinc_path_norm = wp_normalize_path(realpath(ABSPATH . WPINC));
        }

        if (str_starts_with($path, $wpinc_path_norm)) {
            return includes_url(str_replace($wpinc_path_norm, '', $path));
        }

        static $template_paths_norm = array();

        $template = get_template();
        if (! isset($template_paths_norm[$template])) {
            $template_paths_norm[$template] = wp_normalize_path(realpath(get_template_directory()));
        }

        if (str_starts_with($path, trailingslashit($template_paths_norm[$template]))) {
            return get_theme_file_uri(str_replace($template_paths_norm[$template], '', $path));
        }

        if (is_child_theme()) {
            $stylesheet = get_stylesheet();
            if (! isset($template_paths_norm[$stylesheet])) {
                $template_paths_norm[$stylesheet] = wp_normalize_path(realpath(get_stylesheet_directory()));
            }

            if (str_starts_with($path, trailingslashit($template_paths_norm[$stylesheet]))) {
                return get_theme_file_uri(str_replace($template_paths_norm[$stylesheet], '', $path));
            }
        }

        return content_url( str_replace( WP_CONTENT_DIR, '', $path ) );
    }

    private static function register_block_script_handle($metadata, $field_name, $index = 0)
    {
        if (empty($metadata[$field_name])) {
            return false;
        }

        $script_handle_or_path = $metadata[$field_name];
        if (is_array($script_handle_or_path)) {
            if (empty($script_handle_or_path[$index])) {
                return false;
            }
            $script_handle_or_path = $script_handle_or_path[$index];
        }

        $script_path = remove_block_asset_path_prefix($script_handle_or_path);
        if ($script_handle_or_path === $script_path) {
            return $script_handle_or_path;
        }

        $path                  = dirname($metadata['file']);
        $script_asset_raw_path = $path . '/' . substr_replace($script_path, '.asset.php', -strlen('.js'));
        $script_asset_path     = wp_normalize_path(
            realpath($script_asset_raw_path)
        );

        $script_asset  = ! empty($script_asset_path) ? require $script_asset_path : array();
        $script_handle = isset($script_asset['handle']) ?
            $script_asset['handle'] :
            generate_block_asset_handle($metadata['name'], $field_name, $index);
        if (wp_script_is($script_handle, 'registered')) {
            return $script_handle;
        }

        $script_path_norm    = wp_normalize_path(realpath($path . '/' . $script_path));
        $script_uri          = self::get_block_asset_url($script_path_norm);
        $script_dependencies = isset($script_asset['dependencies']) ? $script_asset['dependencies'] : array();
        $block_version       = isset($metadata['version']) ? $metadata['version'] : false;
        $script_version      = isset($script_asset['version']) ? $script_asset['version'] : $block_version;
        $script_args         = array();
        if ('viewScript' === $field_name && $script_uri) {
            $script_args['strategy'] = 'defer';
        }

        $result = wp_register_script(
            $script_handle,
            $script_uri,
            $script_dependencies,
            $script_version,
            $script_args
        );
        if (! $result) {
            return false;
        }

        if (! empty($metadata['textdomain']) && in_array('wp-i18n', $script_dependencies, true)) {
            wp_set_script_translations($script_handle, $metadata['textdomain']);
        }

        return $script_handle;
    }

    private static function register_block_style_handle($metadata, $field_name, $index = 0)
    {
        if (empty($metadata[$field_name])) {
            return false;
        }

        $style_handle = $metadata[$field_name];
        if (is_array($style_handle)) {
            if (empty($style_handle[$index])) {
                return false;
            }
            $style_handle = $style_handle[$index];
        }

        $style_handle_name = generate_block_asset_handle($metadata['name'], $field_name, $index);
        // If the style handle is already registered, skip re-registering.
        if (wp_style_is($style_handle_name, 'registered')) {
            return $style_handle_name;
        }

        static $wpinc_path_norm = '';
        if (! $wpinc_path_norm) {
            $wpinc_path_norm = wp_normalize_path(realpath(ABSPATH . WPINC));
        }

        $is_core_block = isset($metadata['file']) && str_starts_with($metadata['file'], $wpinc_path_norm);
        // Skip registering individual styles for each core block when a bundled version provided.
        if ($is_core_block && ! wp_should_load_separate_core_block_assets()) {
            return false;
        }

        $style_path      = remove_block_asset_path_prefix($style_handle);
        $is_style_handle = $style_handle === $style_path;
        // Allow only passing style handles for core blocks.
        if ($is_core_block && ! $is_style_handle) {
            return false;
        }
        // Return the style handle unless it's the first item for every core block that requires special treatment.
        if ($is_style_handle && ! ($is_core_block && 0 === $index)) {
            return $style_handle;
        }

        // Check whether styles should have a ".min" suffix or not.
        $suffix = SCRIPT_DEBUG ? '' : '.min';
        if ($is_core_block) {
            $style_path = ('editorStyle' === $field_name) ? "editor{$suffix}.css" : "style{$suffix}.css";
        }

        $style_path_norm = wp_normalize_path(realpath(dirname($metadata['file']) . '/' . $style_path));
        $style_uri       = self::get_block_asset_url($style_path_norm);

        $version = ! $is_core_block && isset($metadata['version']) ? $metadata['version'] : false;
        $result  = wp_register_style(
            $style_handle_name,
            $style_uri,
            array(),
            $version
        );
        if (! $result) {
            return false;
        }

        if ($style_uri) {
            wp_style_add_data($style_handle_name, 'path', $style_path_norm);

            if ($is_core_block) {
                $rtl_file = str_replace("{$suffix}.css", "-rtl{$suffix}.css", $style_path_norm);
            } else {
                $rtl_file = str_replace('.css', '-rtl.css', $style_path_norm);
            }

            if (is_rtl() && file_exists($rtl_file)) {
                wp_style_add_data($style_handle_name, 'rtl', 'replace');
                wp_style_add_data($style_handle_name, 'suffix', $suffix);
                wp_style_add_data($style_handle_name, 'path', $rtl_file);
            }
        }

        return $style_handle_name;
    }


    public static function get_block_type_from_metadata($file_or_folder, $args = array())
    {
        $file_or_folder = wp_normalize_path($file_or_folder);

        $metadata_file = (! str_ends_with($file_or_folder, 'block.json')) ?
            trailingslashit($file_or_folder) . 'block.json' :
            $file_or_folder;

        $is_core_block        = str_starts_with($file_or_folder, wp_normalize_path(ABSPATH . WPINC));
        $metadata_file_exists = $is_core_block || file_exists($metadata_file);
        $registry_metadata    = \WP_Block_Metadata_Registry::get_metadata($file_or_folder);

        if ($registry_metadata) {
            $metadata = $registry_metadata;
        } elseif ($metadata_file_exists) {
            $metadata = wp_json_file_decode($metadata_file, array('associative' => true));
        } else {
            $metadata = array();
        }

        if (! is_array($metadata) || (empty($metadata['name']) && empty($args['name']))) {
            return false;
        }

        $metadata['file'] = $metadata_file_exists ? wp_normalize_path(realpath($metadata_file)) : null;

        $metadata = apply_filters('block_type_metadata', $metadata);

        // Add `style` and `editor_style` for core blocks if missing.
        if (! empty($metadata['name']) && str_starts_with($metadata['name'], 'core/')) {
            $block_name = str_replace('core/', '', $metadata['name']);

            if (! isset($metadata['style'])) {
                $metadata['style'] = "wp-block-$block_name";
            }
            if (current_theme_supports('wp-block-styles') && wp_should_load_separate_core_block_assets()) {
                $metadata['style']   = (array) $metadata['style'];
                $metadata['style'][] = "wp-block-{$block_name}-theme";
            }
            if (! isset($metadata['editorStyle'])) {
                $metadata['editorStyle'] = "wp-block-{$block_name}-editor";
            }
        }

        $settings          = array();
        $property_mappings = array(
            'apiVersion'      => 'api_version',
            'name'            => 'name',
            'title'           => 'title',
            'category'        => 'category',
            'parent'          => 'parent',
            'ancestor'        => 'ancestor',
            'icon'            => 'icon',
            'description'     => 'description',
            'keywords'        => 'keywords',
            'attributes'      => 'attributes',
            'providesContext' => 'provides_context',
            'usesContext'     => 'uses_context',
            'selectors'       => 'selectors',
            'supports'        => 'supports',
            'styles'          => 'styles',
            'variations'      => 'variations',
            'example'         => 'example',
            'allowedBlocks'   => 'allowed_blocks',
        );
        $textdomain        = ! empty($metadata['textdomain']) ? $metadata['textdomain'] : null;
        $i18n_schema       = get_block_metadata_i18n_schema();

        foreach ($property_mappings as $key => $mapped_key) {
            if (isset($metadata[$key])) {
                $settings[$mapped_key] = $metadata[$key];
                if ($metadata_file_exists && $textdomain && isset($i18n_schema->$key)) {
                    $settings[$mapped_key] = translate_settings_using_i18n_schema($i18n_schema->$key, $settings[$key], $textdomain);
                }
            }
        }

        if (! empty($metadata['render'])) {
            $template_path = wp_normalize_path(
                realpath(
                    dirname($metadata['file']) . '/' .
                        remove_block_asset_path_prefix($metadata['render'])
                )
            );
            if ($template_path) {
                $settings['render_callback'] = static function ($attributes, $content, $block) use ($template_path) {
                    ob_start();
                    require $template_path;
                    return ob_get_clean();
                };
            }
        }

        // If `variations` is a string, it's the name of a PHP file that
        // generates the variations.
        if (! empty($metadata['variations']) && is_string($metadata['variations'])) {
            $variations_path = wp_normalize_path(
                realpath(
                    dirname($metadata['file']) . '/' .
                        remove_block_asset_path_prefix($metadata['variations'])
                )
            );
            if ($variations_path) {
                $settings['variation_callback'] = static function () use ($variations_path) {
                    $variations = require $variations_path;
                    return $variations;
                };
                // The block instance's `variations` field is only allowed to be an array
                // (of known block variations). We unset it so that the block instance will
                // provide a getter that returns the result of the `variation_callback` instead.
                unset($settings['variations']);
            }
        }

        $settings = array_merge($settings, $args);

        $script_fields = array(
            'editorScript' => 'editor_script_handles',
            'script'       => 'script_handles',
            'viewScript'   => 'view_script_handles',
        );
        foreach ($script_fields as $metadata_field_name => $settings_field_name) {
            if (! empty($settings[$metadata_field_name])) {
                $metadata[$metadata_field_name] = $settings[$metadata_field_name];
            }
            if (! empty($metadata[$metadata_field_name])) {
                $scripts           = $metadata[$metadata_field_name];
                $processed_scripts = array();
                if (is_array($scripts)) {
                    for ($index = 0; $index < count($scripts); $index++) {
                        $result = self::register_block_script_handle(
                            $metadata,
                            $metadata_field_name,
                            $index
                        );
                        if ($result) {
                            $processed_scripts[] = $result;
                        }
                    }
                } else {
                    $result = self::register_block_script_handle(
                        $metadata,
                        $metadata_field_name
                    );
                    if ($result) {
                        $processed_scripts[] = $result;
                    }
                }
                $settings[$settings_field_name] = $processed_scripts;
            }
        }

        $module_fields = array(
            'viewScriptModule' => 'view_script_module_ids',
        );
        foreach ($module_fields as $metadata_field_name => $settings_field_name) {
            if (! empty($settings[$metadata_field_name])) {
                $metadata[$metadata_field_name] = $settings[$metadata_field_name];
            }
            if (! empty($metadata[$metadata_field_name])) {
                $modules           = $metadata[$metadata_field_name];
                $processed_modules = array();
                if (is_array($modules)) {
                    for ($index = 0; $index < count($modules); $index++) {
                        $result = register_block_script_module_id(
                            $metadata,
                            $metadata_field_name,
                            $index
                        );
                        if ($result) {
                            $processed_modules[] = $result;
                        }
                    }
                } else {
                    $result = register_block_script_module_id(
                        $metadata,
                        $metadata_field_name
                    );
                    if ($result) {
                        $processed_modules[] = $result;
                    }
                }
                $settings[$settings_field_name] = $processed_modules;
            }
        }

        $style_fields = array(
            'editorStyle' => 'editor_style_handles',
            'style'       => 'style_handles',
            'viewStyle'   => 'view_style_handles',
        );
        foreach ($style_fields as $metadata_field_name => $settings_field_name) {
            if (! empty($settings[$metadata_field_name])) {
                $metadata[$metadata_field_name] = $settings[$metadata_field_name];
            }
            if (! empty($metadata[$metadata_field_name])) {
                $styles           = $metadata[$metadata_field_name];
                $processed_styles = array();
                if (is_array($styles)) {
                    for ($index = 0; $index < count($styles); $index++) {
                        $result = self::register_block_style_handle(
                            $metadata,
                            $metadata_field_name,
                            $index
                        );
                        if ($result) {
                            $processed_styles[] = $result;
                        }
                    }
                } else {
                    $result = self::register_block_style_handle(
                        $metadata,
                        $metadata_field_name
                    );
                    if ($result) {
                        $processed_styles[] = $result;
                    }
                }
                $settings[$settings_field_name] = $processed_styles;
            }
        }

        if (! empty($metadata['blockHooks'])) {
            $position_mappings = array(
                'before'     => 'before',
                'after'      => 'after',
                'firstChild' => 'first_child',
                'lastChild'  => 'last_child',
            );

            $settings['block_hooks'] = array();
            foreach ($metadata['blockHooks'] as $anchor_block_name => $position) {
                // Avoid infinite recursion (hooking to itself).
                if ($metadata['name'] === $anchor_block_name) {
                    _doing_it_wrong(
                        __METHOD__,
                        __('Cannot hook block to itself.'),
                        '6.4.0'
                    );
                    continue;
                }

                if (! isset($position_mappings[$position])) {
                    continue;
                }

                $settings['block_hooks'][$anchor_block_name] = $position_mappings[$position];
            }
        }

        $settings = apply_filters('block_type_metadata_settings', $settings, $metadata);

        $metadata['name'] = ! empty($settings['name']) ? $settings['name'] : $metadata['name'];

        return ['metadata' => $metadata, 'settings' => $settings];
    }
}
