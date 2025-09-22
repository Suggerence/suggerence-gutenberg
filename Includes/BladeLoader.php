<?php

namespace SuggerenceGutenberg\Includes;

use eftec\bladeone\BladeOne;

class BladeLoader
{
    private static $instance = null;
    private $blade;

    private function __construct()
    {
        $this->blade = new BladeOne(
            SUGGERENCEGUTENBERG_PATH . 'resources/views',
            SUGGERENCEGUTENBERG_PATH . 'resources/cache'
        );
    }

    // Clone not allowed
    private function __clone()
    {
    }

    public static function getInstance()
    {
        if (is_null(self::$instance)) {
            self::$instance = new BladeLoader();
        }
        return self::$instance;
    }

    public function makeDirective(string $name, callable $handler)
    {
        $this->blade->directive($name, $handler);
    }

    public function template($name, $args = [])
    {
        return $this->blade->run($name, $args);
    }
}
