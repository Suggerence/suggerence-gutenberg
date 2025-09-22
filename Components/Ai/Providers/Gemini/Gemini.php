<?php

namespace SuggerenceGutenberg\Components\Ai\Providers\Gemini;

use Illuminate\Http\Client\RequestException;
use SuggerenceGutenberg\Components\Ai\Concerns\InitializesClient;
use SuggerenceGutenberg\Components\Ai\Concerns\IsConfigurable;
use SuggerenceGutenberg\Components\Ai\Exceptions\Exception;
use SuggerenceGutenberg\Components\Ai\Exceptions\ProviderOverloadedException;
use SuggerenceGutenberg\Components\Ai\Exceptions\RateLimitedException;
use SuggerenceGutenberg\Components\Ai\Providers\Gemini\Handlers\Cache;
use SuggerenceGutenberg\Components\Ai\Providers\Gemini\Handlers\Embeddings;
use SuggerenceGutenberg\Components\Ai\Providers\Gemini\Handlers\Images;
use SuggerenceGutenberg\Components\Ai\Providers\Gemini\Handlers\Models;
use SuggerenceGutenberg\Components\Ai\Providers\Gemini\Handlers\Stream;
use SuggerenceGutenberg\Components\Ai\Providers\Gemini\Handlers\Structured;
use SuggerenceGutenberg\Components\Ai\Providers\Gemini\Handlers\Text;
use SuggerenceGutenberg\Components\Ai\Enums\Provider as ProviderName;
use SuggerenceGutenberg\Components\Ai\Providers\Provider;
use SuggerenceGutenberg\Components\Ai\ValueObjects\Messages\SystemMessage;
use Throwable;

class Gemini extends Provider
{
    use InitializesClient, IsConfigurable;

    const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';

    public function __construct(
        public $apiKey,
        public $url
    ) {}

    #[\Override]
    public function text($request)
    {
        $handler = new Text(
            $this->client($request->clientOptions(), $request->clientRetry()),
            $this->apiKey
        );

        return $handler->handle($request);
    }

    #[\Override]
    public function structured($request)
    {
        $handler = new Structured($this->client(
            $request->clientOptions(),
            $request->clientRetry()
        ));

        return $handler->handle($request);
    }

    #[\Override]
    public function embeddings($request)
    {
        $handler = new Embeddings($this->client(
            $request->clientOptions(),
            $request->clientRetry()
        ));

        return $handler->handle($request);
    }

    #[\Override]
    public function images($request)
    {
        $handler = new Images($this->client(
            $request->clientOptions(),
            $request->clientRetry()
        ));

        return $handler->handle($request);
    }

    #[\Override]
    public function stream($request)
    {
        $handler = new Stream(
            $this->client($request->clientOptions(), $request->clientRetry()),
            $this->apiKey
        );

        return $handler->handle($request);
    }

    public function handleRequestException($model, $e)
    {
        match ($e->response->getStatusCode()) {
            429     => throw RateLimitedException::make([]),
            503     => throw ProviderOverloadedException::make(class_basename($this)),
            default => throw Exception::providerRequestError($model, $e)
        };
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

    public function cache($model, $messages = [], $systemPrompts = [], $ttl = null)
    {
        if ($messages === [] && $systemPrompts === []) {
            throw new Exception('At least one message or system prompt must be provided');
        }

        $systemPrompts = array_map(
            fn ($prompt) => $prompt instanceof SystemMessage ? $prompt : new SystemMessage($prompt),
            $systemPrompts
        );

        $handler = new Cache(
            $this->client(self::BASE_URL),
            $model,
            $messages,
            $systemPrompts,
            $ttl
        );

        try {
            return $handler->handle();
        } catch (RequestException $e) {
            $this->handleRequestException($model, $e);
        }
    }

    protected function client($options = [], $retry = [], $baseUrl = null)
    {
        return $this->baseClient()
            ->withHeaders(['x-goog-api-key' => $this->apiKey])
            ->withOptions($options)
            ->when($retry !== [], fn ($client) => $client->retry(...$retry))
            ->baseUrl($baseUrl ?? self::BASE_URL);
    }

    public function info()
    {
        return [
            'id'            => ProviderName::Gemini->value,
            'name'          => ucfirst(ProviderName::Gemini->value),
            'description'   => 'Google Gemini models with function calling support',
            'website'       => 'https://ai.google.dev',
            'icon'          => 'https://www.gstatic.com/images/branding/searchlogo/ico/favicon.ico',
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
                'description' => 'Google Gemini API key',
                'required' => true
            ]
        ];
    }

    public function sensitiveParameters()
    {
        return ['api_key'];
    }
}
