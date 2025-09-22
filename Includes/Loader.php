<?php

namespace SuggerenceGutenberg\Includes;

use ReflectionClass;

class Loader
{
    public function __construct()
    {
        $this->initialize_laravel_services();
        $this->load_dependencies();

        add_action('plugins_loaded', [$this, 'load_plugin_textdomain']);
        add_action('after_setup_theme', [$this, 'load_plubo_routes']);
    }

    /**
     * Initialize Laravel services required by the plugin
     */
    private function initialize_laravel_services(): void
    {
        // Initialize the HTTP service provider to make Laravel's Http facade work
        \SuggerenceGutenberg\Components\HttpServiceProvider::initialize();
    }

    private function load_dependencies(): void
    {
        // FUNCTIONALITY CLASSES
        $this->instantiate_classes_in_dir(
            SUGGERENCEGUTENBERG_PATH . 'Functionality/*.php',
            '\\SuggerenceGutenberg\\Functionality\\'
        );

        // ADMIN FUNCTIONALITY
        if (is_admin()) {
            $this->instantiate_classes_in_dir(
                SUGGERENCEGUTENBERG_PATH . 'Functionality/Admin/*.php',
                '\\SuggerenceGutenberg\\Functionality\\Admin\\'
            );
        }
    }

    /**
     * Instantiate all concrete classes in a directory pattern under a given namespace prefix.
     * - Skips abstract classes and interfaces.
     * - If constructor requires 0 params, calls it with none.
     * - Else tries ($name, $version).
     */
    private function instantiate_classes_in_dir(string $globPattern, string $nsPrefix): void
    {
        foreach (glob($globPattern) as $filename) {
            $basename   = basename($filename, '.php');
            $class_name = $nsPrefix . $basename;

            // Let Composer map it; don't require the file manually.
            if (!class_exists($class_name)) {
                // Not autoloadable; skip quietly.
                continue;
            }

            try {
                $rc = new ReflectionClass($class_name);

                // ❌ Never instantiate abstract classes or interfaces
                if ($rc->isAbstract() || $rc->isInterface()) {
                    continue;
                }

                // Decide how to construct
                $ctor = $rc->getConstructor();
                if ($ctor === null || $ctor->getNumberOfRequiredParameters() === 0) {
                    $rc->newInstance();
                } else {
                    // Your classes typically accept ($name, $version)
                    $rc->newInstance(SUGGERENCEGUTENBERG_NAME, SUGGERENCEGUTENBERG_VERSION);
                }
            } catch (\Throwable $e) {
                suggerence_log($e);
                continue;
            }
        }
    }

    public function load_plugin_textdomain(): void
    {
        load_plugin_textdomain('suggerence-gutenberg', false, dirname(SUGGERENCEGUTENBERG_BASENAME) . '/languages/');
    }

    public function load_plubo_routes(): void
    {
        \PluboRoutes\RoutesProcessor::init();
    }
}
