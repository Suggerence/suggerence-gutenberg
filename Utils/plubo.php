<?php

if (!function_exists("suggerence_log")) {
    /**
     * Enhanced logging function with WooCommerce integration and powerful features
     * 
     * @param mixed $log The data to log
     * @param string $level Log level: debug, info, warning, error, critical
     * @param array $context Additional context data (user_id, request_id, etc.)
     * @param string $source Custom source identifier
     */
    function suggerence_log($log, $level = 'info', $context = [], $source = '')
    {
        // Validate log level
        $valid_levels = ['debug', 'info', 'warning', 'error', 'critical'];
        if (!in_array($level, $valid_levels)) {
            $level = 'info';
        }

        // Get enhanced backtrace information
        $backtrace = debug_backtrace();
        $caller = $backtrace[1] ?? [];
        $class = $caller['class'] ?? '';
        $function = $caller['function'] ?? '';
        $file = $caller['file'] ?? '';
        $line = $caller['line'] ?? '';
        
        // Get additional backtrace context
        $full_trace = [];
        foreach (array_slice($backtrace, 0, 5) as $trace) {
            $full_trace[] = [
                'file' => $trace['file'] ?? '',
                'line' => $trace['line'] ?? '',
                'function' => $trace['function'] ?? '',
                'class' => $trace['class'] ?? ''
            ];
        }

        // Prepare context data
        $context_data = array_merge([
            'timestamp' => current_time('mysql'),
            'memory_usage' => memory_get_usage(true),
            'memory_peak' => memory_get_peak_usage(true),
            'user_id' => get_current_user_id(),
            'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? '',
            'request_uri' => $_SERVER['REQUEST_URI'] ?? '',
            'request_method' => $_SERVER['REQUEST_METHOD'] ?? '',
            'ip_address' => $_SERVER['REMOTE_ADDR'] ?? '',
            'wp_version' => get_bloginfo('version'),
            'plugin_version' => defined('SUGGERENCEGUTENBERG_VERSION') ? SUGGERENCEGUTENBERG_VERSION : 'unknown'
        ], $context);

        // Format the log data
        $log_data = [
            'level' => strtoupper($level),
            'message' => is_string($log) ? $log : print_r($log, true),
            'source' => $source ?: ($class ? $class . '::' . $function : $function),
            'file' => $file,
            'line' => $line,
            'context' => $context_data,
            'backtrace' => $full_trace
        ];

        // Try to use WooCommerce logger if available
        if (class_exists('WooCommerce')) {
            try {
                // Check if wc_get_logger function exists and is callable
                $wc_get_logger_func = 'wc_get_logger';
                if (function_exists($wc_get_logger_func) && is_callable($wc_get_logger_func)) {
                    $wc_logger = call_user_func($wc_get_logger_func);
                    $log_entry = sprintf(
                        "[%s] %s: %s | File: %s:%s | Context: %s",
                        $log_data['level'],
                        $log_data['source'],
                        $log_data['message'],
                        basename($log_data['file']),
                        $log_data['line'],
                        json_encode($log_data['context'])
                    );
                    
                    $wc_logger->log($level, $log_entry, ['source' => 'suggerence']);
                    return;
                }
            } catch (Exception $e) {
                // Fall back to error_log if WooCommerce logger fails
            }
        }

        // Fallback to enhanced error_log
        $formatted_log = sprintf(
            "\n=== SUGGERENCE LOG [%s] ===\n" .
            "Level: %s\n" .
            "Source: %s\n" .
            "File: %s:%s\n" .
            "Timestamp: %s\n" .
            "User ID: %s\n" .
            "Memory: %s / %s\n" .
            "Request: %s %s\n" .
            "Message: %s\n" .
            "Context: %s\n" .
            "Backtrace:\n%s\n" .
            "=== END LOG ===\n",
            $log_data['level'],
            $log_data['level'],
            $log_data['source'],
            basename($log_data['file']),
            $log_data['line'],
            $log_data['context']['timestamp'],
            $log_data['context']['user_id'],
            size_format($log_data['context']['memory_usage']),
            size_format($log_data['context']['memory_peak']),
            $log_data['context']['request_method'],
            $log_data['context']['request_uri'],
            $log_data['message'],
            json_encode($log_data['context'], JSON_PRETTY_PRINT),
            json_encode($log_data['backtrace'], JSON_PRETTY_PRINT)
        );

        error_log($formatted_log);
    }
}

if (!function_exists("suggerence_log_debug")) {
    /**
     * Debug level logging
     */
    function suggerence_log_debug($log, $context = [], $source = '') {
        suggerence_log($log, 'debug', $context, $source);
    }
}

if (!function_exists("suggerence_log_info")) {
    /**
     * Info level logging
     */
    function suggerence_log_info($log, $context = [], $source = '') {
        suggerence_log($log, 'info', $context, $source);
    }
}

if (!function_exists("suggerence_log_warning")) {
    /**
     * Warning level logging
     */
    function suggerence_log_warning($log, $context = [], $source = '') {
        suggerence_log($log, 'warning', $context, $source);
    }
}

if (!function_exists("suggerence_log_error")) {
    /**
     * Error level logging
     */
    function suggerence_log_error($log, $context = [], $source = '') {
        suggerence_log($log, 'error', $context, $source);
    }
}

if (!function_exists("suggerence_log_critical")) {
    /**
     * Critical level logging
     */
    function suggerence_log_critical($log, $context = [], $source = '') {
        suggerence_log($log, 'critical', $context, $source);
    }
}