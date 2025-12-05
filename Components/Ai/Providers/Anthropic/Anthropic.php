<?php

namespace SuggerenceGutenberg\Components\Ai\Providers\Anthropic;

use SuggerenceGutenberg\Components\Ai\Concerns\InitializesClient;
use SuggerenceGutenberg\Components\Ai\Concerns\IsConfigurable;
use SuggerenceGutenberg\Components\Ai\Exceptions\ProviderOverloadedException;
use SuggerenceGutenberg\Components\Ai\Exceptions\RateLimitedException;
use SuggerenceGutenberg\Components\Ai\Providers\Provider;
use SuggerenceGutenberg\Components\Ai\Providers\Anthropic\Concerns\ProcessesRateLimits;
use SuggerenceGutenberg\Components\Ai\Providers\Anthropic\Handlers\Stream;
use SuggerenceGutenberg\Components\Ai\Providers\Anthropic\Handlers\Structured;
use SuggerenceGutenberg\Components\Ai\Providers\Anthropic\Handlers\Text;
use SuggerenceGutenberg\Components\Ai\Enums\Provider as ProviderName;
use SuggerenceGutenberg\Components\Ai\Exceptions\Exception;
use SuggerenceGutenberg\Components\Ai\Exceptions\RequestTooLargeException;
use SuggerenceGutenberg\Components\Ai\Providers\Anthropic\Handlers\Models;
use Throwable;

class Anthropic extends Provider
{
    use InitializesClient, IsConfigurable, ProcessesRateLimits;

    const BASE_URL = 'https://api.anthropic.com/v1';

    public function __construct(
        public $apiKey,
        public $apiVersion,
        public $betaFeatures = null
    ) {}

    public function text($request)
    {
        $handler = new Text(
            $this->client(
                $request->clientOptions(),
                $request->clientRetry()
            ),
            $request
        );

        return $handler->handle();
    }

    public function structured($request)
    {
        $handler = new Structured(
            $this->client(
                $request->clientOptions(),
                $request->clientRetry()
            ),
            $request
        );

        return $handler->handle();
    }

    public function stream($request)
    {
        $handler = new Stream(
            $this->client(
                $request->clientOptions(),
                $request->clientRetry()
            )
        );

        return $handler->handle($request);
    }

    public function models()
    {
        try {
            $handler = new Models($this->client());
    
            return $handler->handle();
        } catch (Throwable $e) {
            return [];
        }
    }

    public function handleRequestException($model, $e)
    {
        match($e->response->getStatusCode()) {
            429     => throw RateLimitedException::make(
                $this->processRateLimits($e->response),
                $e->response->hasHeader('retry-after') ? (int) $e->response->getHeader('retry-after')[0] : null
            ),
            529     => throw ProviderOverloadedException::make(ProviderName::Anthropic),
            413     => throw RequestTooLargeException::make(ProviderName::Anthropic),
            default => throw Exception::providerRequestError($model, $e)
        };
    }

    protected function client($options = [], $retry = [], $baseUrl = null)
    {
        return $this->baseClient()
            ->withHeaders(array_filter([
                'x-api-key'         => $this->apiKey,
                'anthropic-version' => $this->apiVersion,
                'anthropic-beta'    => $this->betaFeatures
            ]))
            ->withOptions($options)
            ->when($retry !== [], fn($client) => $client->retry(...$retry))
            ->baseUrl($baseUrl ?? self::BASE_URL);
    }

    public function info()
    {
        return [
            'id'            => ProviderName::Anthropic->value,
            'name'          => ucfirst(ProviderName::Anthropic->value),
            'description'   => 'Anthropic Claude models with function calling support',
            'website'       => 'https://anthropic.com',
            'icon'          => 'https://www.anthropic.com/favicon.ico',
            'configured'    => $this->apiKey !== '',
            'models'        => $this->models(),
            'configuration' => $this->configuration(),
            'schema'        => $this->configurationSchema()
        ];
    }

    public function configurationSchema()
    {
        return [
            'api_key' => [
                'type' => 'string',
                'description' => 'Anthropic API key',
                'required' => true
            ],
            'api_version' => [
                'type' => 'string',
                'description' => 'Anthropic API version',
                'required' => false,
                'default' => '2023-06-01'
            ],
            'beta_features' => [
                'type' => 'array',
                'description' => 'Anthropic beta features',
                'required' => false,
                'default' => []
            ]
        ];
    }

    public function sensitiveParameters()
    {
        return ['api_key'];
    }
}
