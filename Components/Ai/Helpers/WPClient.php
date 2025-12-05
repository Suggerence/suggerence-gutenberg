<?php

namespace SuggerenceGutenberg\Components\Ai\Helpers;

use Exception;
use WP_Error;

class WPClient
{
    protected $baseUrl = '';
    protected $headers = [];
    protected $options = [];
    protected $shouldThrow = false;
    protected $retryConfig = [];
    protected $requestMiddleware = null;
    protected $responseMiddleware = null;

    public function baseUrl($url)
    {
        $this->baseUrl = rtrim($url, '/');
        return $this;
    }

    public function withHeaders($headers)
    {
        $this->headers = array_merge($this->headers, $headers);
        return $this;
    }

    public function withOptions($options)
    {
        $this->options = array_merge($this->options, $options);
        return $this;
    }

    public function withToken($token)
    {
        return $this->withHeaders([
            'Authorization' => 'Bearer ' . $token
        ]);
    }

    public function throw($shouldThrow = true)
    {
        $this->shouldThrow = $shouldThrow;
        return $this;
    }

    public function retry($times = 3, $sleepMilliseconds = 0, $when = null, $throw = true)
    {
        $this->retryConfig = [
            'times' => $times,
            'sleep' => $sleepMilliseconds,
            'when' => $when,
            'throw' => $throw,
        ];
        return $this;
    }

    public function withRequestMiddleware($middleware)
    {
        $this->requestMiddleware = $middleware;
        return $this;
    }

    public function withResponseMiddleware($middleware)
    {
        $this->responseMiddleware = $middleware;
        return $this;
    }

    public function when($condition, $callback)
    {
        if ($condition) {
            return $callback($this);
        }
        return $this;
    }

    public function post($endpoint, $data = [])
    {
        return $this->send('POST', $endpoint, $data);
    }

    public function get($endpoint, $data = [])
    {
        return $this->send('GET', $endpoint, $data);
    }

    protected function send($method, $endpoint, $data = [])
    {
        $url = $this->baseUrl ? $this->baseUrl . '/' . ltrim($endpoint, '/') : $endpoint;

        $args = [
            'method' => $method,
            'headers' => $this->buildHeaders(),
            'body' => $method === 'POST' ? json_encode($data) : null,
            'timeout' => $this->options['timeout'] ?? 30,
        ];

        // Apply request middleware
        if ($this->requestMiddleware) {
            $args = call_user_func($this->requestMiddleware, $args);
        }

        $response = $this->executeWithRetry(function () use ($url, $args) {
            if ($args['method'] === 'POST') {
                return wp_remote_post($url, $args);
            }
            return wp_remote_get($url, $args);
        });

        // Apply response middleware
        if ($this->responseMiddleware) {
            $response = call_user_func($this->responseMiddleware, $response);
        }

        return new WPResponse($response, $this->shouldThrow);
    }

    protected function buildHeaders()
    {
        $headers = array_merge([
            'Content-Type' => 'application/json',
            'Accept' => 'application/json',
        ], $this->headers);

        return $headers;
    }

    protected function executeWithRetry($callback)
    {
        if (empty($this->retryConfig)) {
            return $callback();
        }

        $maxAttempts = max(1, $this->retryConfig['times'] ?? 3);
        $sleepMs = $this->retryConfig['sleep'] ?? 0;
        $when = $this->retryConfig['when'] ?? null;

        $attempts = 0;
        $response = null;

        while ($attempts < $maxAttempts) {
            $response = $callback();

            // Check if we should retry
            if (!is_wp_error($response)) {
                $statusCode = wp_remote_retrieve_response_code($response);
                
                // Success, return response
                if ($statusCode >= 200 && $statusCode < 300) {
                    return $response;
                }

                // Check if we should retry based on condition
                if ($when && !call_user_func($when, $response)) {
                    return $response;
                }
            }

            $attempts++;

            if ($attempts < $maxAttempts && $sleepMs > 0) {
                usleep($sleepMs * 1000);
            }
        }

        return $response;
    }
}

class WPResponse
{
    protected $response;
    protected $shouldThrow;

    public function __construct($response, $shouldThrow = false)
    {
        $this->response = $response;
        $this->shouldThrow = $shouldThrow;

        if ($shouldThrow) {
            $this->throwIfError();
        }
    }

    public function json()
    {
        $body = wp_remote_retrieve_body($this->response);
        return json_decode($body, true);
    }

    public function body()
    {
        return wp_remote_retrieve_body($this->response);
    }

    public function status()
    {
        return wp_remote_retrieve_response_code($this->response);
    }

    public function successful()
    {
        $status = $this->status();
        return $status >= 200 && $status < 300;
    }

    public function failed()
    {
        return !$this->successful();
    }

    public function headers()
    {
        return wp_remote_retrieve_headers($this->response);
    }

    public function getHeaders()
    {
        $headers = wp_remote_retrieve_headers($this->response);
        
        $formattedHeaders = [];
        if (is_array($headers)) {
            foreach ($headers as $key => $value) {
                $formattedHeaders[$key] = is_array($value) ? $value : [$value];
            }
        }
        
        return $formattedHeaders;
    }

    public function header($name)
    {
        return wp_remote_retrieve_header($this->response, $name);
    }

    protected function throwIfError()
    {
        if (is_wp_error($this->response)) {
            throw new Exception('WordPress HTTP Error: ' . $this->response->get_error_message());
        }

        if ($this->failed()) {
            $body = $this->body();
            throw new Exception(
                'HTTP request failed with status ' . $this->status() . ': ' . $body
            );
        }
    }
}
