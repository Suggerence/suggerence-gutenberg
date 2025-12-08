<?php

namespace SuggerenceGutenberg\Functionality\Endpoints;

use SuggerenceGutenberg\Functionality\BaseApiEndpoints;
use PluboRoutes\Endpoint\GetEndpoint;
use PluboRoutes\Endpoint\PostEndpoint;
use PluboRoutes\Middleware\Cors;
use SuggerenceGutenberg\Functionality\Options\ApiKeyEncryption;

class ApiKeySettings extends BaseApiEndpoints
{
    public function __construct($plugin_name, $plugin_version)
    {
        parent::__construct($plugin_name, $plugin_version, 'suggerence-gutenberg/settings/v1');
    }

    public function define_endpoints()
    {
        $cors = new Cors('*', ['GET', 'POST', 'OPTIONS'], ['Content-Type', 'Authorization', 'X-Requested-With']);

        $endpoints = [];

        $getEndpoint = new GetEndpoint(
            $this->namespace,
            'suggerence-api-key',
            [$this, 'get_api_key'],
            [$this, 'admin_permissions_check']
        );
        $getEndpoint->useMiddleware($cors);
        $endpoints[] = $getEndpoint;

        $setEndpoint = new PostEndpoint(
            $this->namespace,
            'suggerence-api-key',
            [$this, 'set_api_key'],
            [$this, 'admin_permissions_check']
        );
        $setEndpoint->useMiddleware($cors);
        $endpoints[] = $setEndpoint;

        $removeEndpoint = new PostEndpoint(
            $this->namespace,
            'suggerence-api-key/remove',
            [$this, 'remove_api_key'],
            [$this, 'admin_permissions_check']
        );
        $removeEndpoint->useMiddleware($cors);
        $endpoints[] = $removeEndpoint;

        return $endpoints;
    }

    public function get_api_key()
    {
        $value = ApiKeyEncryption::get();
        return new \WP_REST_Response(['configured' => $value !== ''], self::HTTP_OK);
    }

    public function set_api_key($request)
    {
        $apiKey = (string)$request->get_param('api_key');
        if (trim($apiKey) === '') {
            return new \WP_Error(self::HTTP_BAD_REQUEST, 'API key is required');
        }

        if (!ApiKeyEncryption::save($apiKey)) {
            return new \WP_Error(self::HTTP_INTERNAL_SERVER_ERROR, 'Unable to save API key');
        }

        return new \WP_REST_Response(['configured' => true], self::HTTP_OK);
    }

    public function remove_api_key()
    {
        ApiKeyEncryption::remove();
        return new \WP_REST_Response(['configured' => false], self::HTTP_OK);
    }
}
