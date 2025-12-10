<?php

namespace SuggerenceGutenberg\Functionality\Endpoints;

use SuggerenceGutenberg\Functionality\BaseApiEndpoints;
use PluboRoutes\Endpoint\PostEndpoint;
use PluboRoutes\Middleware\Cors;
use SuggerenceGutenberg\Components\ApiKeyEncryption;

class AuthTokens extends BaseApiEndpoints
{
    private const API_EMAIL_OPTION = 'suggerence_api_email';
    private const API_BASE_URL = 'https://api.suggerence.com/v1';
    // private const API_BASE_URL = 'https://c831e75579a2.ngrok-free.app/v1';

    public function __construct($plugin_name, $plugin_version)
    {
        parent::__construct($plugin_name, $plugin_version, 'suggerence-gutenberg/auth/v1');
    }

    public function define_endpoints()
    {
        $cors = new Cors('*', ['POST', 'OPTIONS'], ['Content-Type', 'Authorization', 'X-Requested-With']);

        $loginEndpoint = new PostEndpoint(
            $this->namespace,
            'login',
            [$this, 'login'],
            [$this, 'admin_permissions_check']
        );
        $loginEndpoint->useMiddleware($cors);

        $refreshEndpoint = new PostEndpoint(
            $this->namespace,
            'refresh',
            [$this, 'refresh'],
            [$this, 'admin_permissions_check']
        );
        $refreshEndpoint->useMiddleware($cors);

        return [
            $loginEndpoint,
            $refreshEndpoint,
        ];
    }

    public function login()
    {
        $credentials = $this->getStoredCredentials();
        if (is_wp_error($credentials)) {
            return $credentials;
        }

        $response = $this->requestSuggerenceApi('/auth/login', [
            'email' => $credentials['email'],
            'api_key' => $credentials['api_key'],
        ]);

        if (is_wp_error($response)) {
            return $response;
        }

        return new \WP_REST_Response($response, self::HTTP_OK);
    }

    public function refresh($request)
    {
        $refreshToken = (string)$request->get_param('refresh_token');
        if (trim($refreshToken) === '') {
            return new \WP_Error(self::HTTP_BAD_REQUEST, esc_html__('Refresh token is required', 'suggerence-gutenberg'));
        }

        $response = $this->requestSuggerenceApi('/auth/refresh', [
            'refresh_token' => $refreshToken,
        ]);

        if (is_wp_error($response)) {
            return $response;
        }

        return new \WP_REST_Response($response, self::HTTP_OK);
    }

    private function getStoredCredentials()
    {
        $apiKey = ApiKeyEncryption::get();
        $email = get_option(self::API_EMAIL_OPTION, '');

        if (!is_string($email)) {
            $email = '';
        }

        if (trim($apiKey) === '' || trim($email) === '') {
            return new \WP_Error(
                self::HTTP_BAD_REQUEST,
                esc_html__('Suggerence API credentials are not configured', 'suggerence-gutenberg')
            );
        }

        return [
            'api_key' => $apiKey,
            'email' => $email,
        ];
    }

    private function requestSuggerenceApi(string $path, array $payload)
    {
        $url = trailingslashit(self::API_BASE_URL) . ltrim($path, '/');
        $response = wp_remote_post($url, [
            'headers' => [
                'Content-Type' => 'application/json',
                'Accept' => 'application/json',
            ],
            'body' => wp_json_encode($payload),
            'timeout' => 20,
        ]);

        if (is_wp_error($response)) {
            return new \WP_Error(
                self::HTTP_BAD_GATEWAY,
                esc_html__('Unable to communicate with Suggerence API', 'suggerence-gutenberg'),
                ['error' => $response->get_error_message()]
            );
        }

        $status = (int)wp_remote_retrieve_response_code($response);
        $body = json_decode(wp_remote_retrieve_body($response), true);
        error_log(print_r($body, true));
        error_log(print_r($status, true));
        $body = is_array($body) ? $body : [];

        if ($status < 200 || $status >= 300) {
            $message = isset($body['error']) ? (string)$body['error'] : esc_html__('Authentication failed', 'suggerence-gutenberg');
            return new \WP_Error($status ?: self::HTTP_BAD_GATEWAY, $message, ['response' => $body]);
        }

        return $this->normalizeTokenResponse($body);
    }

    private function normalizeTokenResponse(array $response)
    {
        $token = isset($response['token']) ? (string)$response['token'] : '';
        $refreshToken = isset($response['refresh_token']) ? (string)$response['refresh_token'] : '';

        if ($token === '' || $refreshToken === '') {
            return new \WP_Error(
                self::HTTP_BAD_GATEWAY,
                esc_html__('Unexpected response from Suggerence API', 'suggerence-gutenberg')
            );
        }

        return [
            'token' => $token,
            'token_type' => isset($response['token_type']) ? (string)($response['token_type'] ?? 'bearer') : 'bearer',
            'expires_at' => isset($response['expires_at']) ? (string)$response['expires_at'] : '',
            'expires_in' => isset($response['expires_in']) ? (int)$response['expires_in'] : 0,
            'refresh_token' => $refreshToken,
            'refresh_expires_at' => isset($response['refresh_expires_at']) ? (string)$response['refresh_expires_at'] : '',
        ];
    }
}
