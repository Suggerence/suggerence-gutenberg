<?php

namespace SuggerenceGutenberg\Functionality\Endpoints;

use SuggerenceGutenberg\Functionality\BaseApiEndpoints;
use PluboRoutes\Endpoint\GetEndpoint;
use PluboRoutes\Endpoint\PostEndpoint;
use PluboRoutes\Middleware\Cors;
use SuggerenceGutenberg\Components\ApiKeyEncryption;

class ApiKeySettings extends BaseApiEndpoints
{
    private const API_EMAIL_OPTION = 'suggerence_api_email';
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
        $apiKey = ApiKeyEncryption::get();
        $email = $this->get_api_email();

        return new \WP_REST_Response(
            [
                'configured' => $this->is_configured($apiKey, $email),
                'email' => $email,
            ],
            self::HTTP_OK
        );
    }

    public function set_api_key($request)
    {
        $apiKey = (string)$request->get_param('api_key');
        $email = (string)$request->get_param('email');

        $sanitizedEmail = \sanitize_email($email);
        if ($sanitizedEmail === '' || !\is_email($sanitizedEmail)) {
            return new \WP_Error(self::HTTP_BAD_REQUEST, 'A valid email address is required');
        }

        if (trim($apiKey) === '') {
            return new \WP_Error(self::HTTP_BAD_REQUEST, 'API key is required');
        }

        if (!ApiKeyEncryption::save($apiKey)) {
            return new \WP_Error(self::HTTP_INTERNAL_SERVER_ERROR, 'Unable to save API key');
        }

        if (!$this->save_api_email($sanitizedEmail)) {
            ApiKeyEncryption::remove();
            return new \WP_Error(self::HTTP_INTERNAL_SERVER_ERROR, 'Unable to save email');
        }

        return new \WP_REST_Response([
            'configured' => true,
            'email' => $sanitizedEmail,
        ], self::HTTP_OK);
    }

    public function remove_api_key()
    {
        ApiKeyEncryption::remove();
        $this->remove_api_email();

        return new \WP_REST_Response([
            'configured' => false,
            'email' => '',
        ], self::HTTP_OK);
    }

    private function get_api_email(): string
    {
        $email = \get_option(self::API_EMAIL_OPTION, '');

        return is_string($email) ? $email : '';
    }

    private function save_api_email(string $email): bool
    {
        return \update_option(self::API_EMAIL_OPTION, $email);
    }

    private function remove_api_email(): bool
    {
        return \delete_option(self::API_EMAIL_OPTION);
    }

    private function is_configured(string $apiKey, string $email): bool
    {
        return $apiKey !== '' && $email !== '';
    }
}
