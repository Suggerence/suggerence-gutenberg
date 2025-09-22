<?php

namespace SuggerenceGutenberg\Components;

use Illuminate\Container\Container;
use Illuminate\Http\Client\Factory;
use Illuminate\Support\Facades\Facade;
use Illuminate\Support\Facades\Http;

/**
 * HTTP Service Provider for WordPress Plugin
 * 
 * This class initializes Laravel's HTTP client and service container
 * to make the Http facade work in a WordPress plugin context.
 */
class HttpServiceProvider
{
    private static $container = null;
    private static $initialized = false;

    /**
     * Initialize the Laravel service container and HTTP client
     */
    public static function initialize()
    {
        if (self::$initialized) {
            return;
        }

        // Create a new container instance
        self::$container = new Container();

        // Bind the HTTP client factory to the container
        self::$container->singleton('http', function () {
            return new Factory();
        });

        // Set the container as the facade root
        Facade::setFacadeApplication(self::$container);

        // Bind the Http facade to the HTTP client factory
        self::$container->alias('http', Http::class);

        self::$initialized = true;
    }

    /**
     * Get the container instance
     */
    public static function getContainer()
    {
        return self::$container;
    }

    /**
     * Check if the service provider has been initialized
     */
    public static function isInitialized()
    {
        return self::$initialized;
    }

    /**
     * Reset the service provider (useful for testing)
     */
    public static function reset()
    {
        self::$container = null;
        self::$initialized = false;
        Facade::clearResolvedInstances();
    }
}
