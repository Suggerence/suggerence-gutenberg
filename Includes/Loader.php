<?php

namespace SuggerenceGutenberg\Includes;

class Loader
{
    public function __construct()
    {
        $this->loadDependencies();

        add_action('plugins_loaded', [$this, 'loadPluginTextdomain']);
    }

    private function loadDependencies()
    {
        //FUNCTIONALITY CLASSES
        foreach (glob(SUGGERENCEGUTENBERG_PATH . 'Functionality/*.php') as $filename) {
            $class_name = '\\SuggerenceGutenberg\Functionality\\' . basename($filename, '.php');
            if (class_exists($class_name)) {
                try {
                    new $class_name(SUGGERENCEGUTENBERG_NAME, SUGGERENCEGUTENBERG_VERSION);
                } catch (\Throwable $e) {
                    pb_log($e);
                    continue;
                }
            }
        }

        //ADMIN FUNCTIONALITY
        if( is_admin() ) {
            foreach (glob(SUGGERENCEGUTENBERG_PATH . 'Functionality/Admin/*.php') as $filename) {
                $class_name = '\\SuggerenceGutenberg\Functionality\Admin\\' . basename($filename, '.php');
                if (class_exists($class_name)) {
                    try {
                        new $class_name(SUGGERENCEGUTENBERG_NAME, SUGGERENCEGUTENBERG_VERSION);
                    } catch (\Throwable $e) {
                        pb_log($e);
                        continue;
                    }
                }
            }
        }
    }

    public function loadPluginTextdomain()
    {
        load_plugin_textdomain('suggerence-gutenberg', false, dirname(SUGGERENCEGUTENBERG_BASENAME) . '/languages/');
    }
}
