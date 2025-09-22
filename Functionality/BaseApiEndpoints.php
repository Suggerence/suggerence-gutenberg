<?php

namespace SuggerenceGutenberg\Functionality;

use PluboRoutes\Middleware\SchemaValidator;

/**
 * Base class for all API endpoint groups
 * Provides common functionality for endpoint registration and management
 */
abstract class BaseApiEndpoints
{
    // HTTP Status Code Constants
    const HTTP_OK = 200;
    const HTTP_CREATED = 201;
    const HTTP_NO_CONTENT = 204;
    const HTTP_BAD_REQUEST = 400;
    const HTTP_UNAUTHORIZED = 401;
    const HTTP_FORBIDDEN = 403;
    const HTTP_NOT_FOUND = 404;
    const HTTP_METHOD_NOT_ALLOWED = 405;
    const HTTP_NOT_ACCEPTABLE = 406;
    const HTTP_UNSUPPORTED_MEDIA_TYPE = 415;
    const HTTP_UNPROCESSABLE_ENTITY = 422;
    const HTTP_TOO_MANY_REQUESTS = 429;
    const HTTP_INTERNAL_SERVER_ERROR = 500;
    const HTTP_BAD_GATEWAY = 502;
    const HTTP_SERVICE_UNAVAILABLE = 503;

    // Common Error Codes
    const ERROR_VALIDATION_FAILED = 'validation_failed';
    const ERROR_INVALID_PARAMETER = 'invalid_parameter';
    const ERROR_MISSING_PARAMETER = 'missing_parameter';
    const ERROR_PERMISSION_DENIED = 'permission_denied';
    const ERROR_NOT_FOUND = 'not_found';
    const ERROR_ALREADY_EXISTS = 'already_exists';
    const ERROR_SERVER_ERROR = 'server_error';
    const ERROR_EXTERNAL_API_ERROR = 'external_api_error';
    const ERROR_RATE_LIMITED = 'rate_limited';

    protected $plugin_name;
    protected $plugin_version;
    protected $namespace;
    protected $endpoints = [];

    public function __construct($plugin_name, $plugin_version, $namespace = 'suggerence/v1')
    {
        $this->plugin_name = $plugin_name;
        $this->plugin_version = $plugin_version;
        $this->namespace = $namespace;
        
        add_filter('plubo/endpoints', [$this, 'register_endpoints']);
    }

    /**
     * Register endpoints with the plubo router
     */
    public function register_endpoints($endpoints)
    {
        $this->endpoints = $this->define_endpoints();
        return array_merge($endpoints, $this->endpoints);
    }

    /**
     * Define the endpoints for this group
     * Must be implemented by child classes
     */
    abstract public function define_endpoints();

    /**
     * Load JSON schema from file
     */
    protected function load_schema($schema_file)
    {
        $schema_path = SUGGERENCEGUTENBERG_SCHEMAS_PATH . $schema_file;
        if (!file_exists($schema_path)) {
            error_log("Schema file not found: " . $schema_path);
            return [];
        }
        
        $schema_content = file_get_contents($schema_path);
        if ($schema_content === false) {
            error_log("Failed to read schema file: " . $schema_path);
            return [];
        }
        
        $schema = json_decode($schema_content, true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            error_log("Invalid JSON in schema file: " . $schema_path . " - " . json_last_error_msg());
            return [];
        }
        
        return $schema;
    }

    /**
     * Create schema validator middleware
     */
    protected function create_schema_validator($schema_file)
    {
        return new SchemaValidator($this->load_schema($schema_file));
    }

    /**
     * Common permission check for admin endpoints
     */
    public function admin_permissions_check()
    {
        return current_user_can('manage_options');
    }

    /**
     * Log endpoint activity
     */
    protected function log_endpoint_activity($action, $data = [])
    {
        if (function_exists('suggerence_log_info')) {
            suggerence_log_info("Endpoint activity: {$action}", array_merge([
                'endpoint_group' => get_class($this),
                'namespace' => $this->namespace
            ], $data));
        }
    }

    /**
     * Create a standardized error response
     */
    protected function error_response($status_code, $error_code, $message = '')
    {
        $response_data = [
            'error' => $error_code,
            'message' => $message,
            'status' => $status_code
        ];

        return new \WP_Error($status_code, $message, $response_data);
    }

    /**
     * Handle exceptions with standardized error responses
     */
    protected function handle_exception(\Exception $e, $operation = 'operation')
    {
        $this->log_endpoint_activity("Exception in {$operation}", [
            'error' => $e->getMessage(),
            'file' => $e->getFile(),
            'line' => $e->getLine()
        ]);

        return $this->error_response(
            self::HTTP_INTERNAL_SERVER_ERROR,
            self::ERROR_SERVER_ERROR,
            "Failed to {$operation}",
            ['message' => $e->getMessage()]
        );
    }

    /**
     * Check if user has specific capability
     */
    protected function check_user_capability($capability, $error_message = 'Insufficient permissions')
    {
        if (!current_user_can($capability)) {
            return $this->error_response(
                self::HTTP_FORBIDDEN,
                self::ERROR_PERMISSION_DENIED,
                $error_message,
                ['required_capability' => $capability]
            );
        }

        return null;
    }
}
