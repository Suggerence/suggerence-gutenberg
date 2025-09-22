<?php

namespace SuggerenceGutenberg\Components\Ai\Providers\OpenAI;

use SuggerenceGutenberg\Components\Ai\Concerns\InitializesClient;
use SuggerenceGutenberg\Components\Ai\Concerns\IsConfigurable;
use SuggerenceGutenberg\Components\Ai\Exceptions\Exception;
use SuggerenceGutenberg\Components\Ai\Exceptions\ProviderOverloadedException;
use SuggerenceGutenberg\Components\Ai\Exceptions\RateLimitedException;
use SuggerenceGutenberg\Components\Ai\Exceptions\RequestTooLargeException;
use SuggerenceGutenberg\Components\Ai\Enums\Provider as ProviderName;
use SuggerenceGutenberg\Components\Ai\Providers\OpenAI\Concerns\ProcessRateLimits;
use SuggerenceGutenberg\Components\Ai\Providers\OpenAI\Handlers\Audio;
use SuggerenceGutenberg\Components\Ai\Providers\OpenAI\Handlers\Embeddings;
use SuggerenceGutenberg\Components\Ai\Providers\OpenAI\Handlers\Images;
use SuggerenceGutenberg\Components\Ai\Providers\OpenAI\Handlers\Models;
use SuggerenceGutenberg\Components\Ai\Providers\OpenAI\Handlers\Stream;
use SuggerenceGutenberg\Components\Ai\Providers\OpenAI\Handlers\Structured;
use SuggerenceGutenberg\Components\Ai\Providers\OpenAI\Handlers\Text;
use SuggerenceGutenberg\Components\Ai\Providers\Provider;
use Throwable;

class OpenAI extends Provider
{
    use InitializesClient;
    use IsConfigurable;
    use ProcessRateLimits;

    const BASE_URL = 'https://api.openai.com/v1';

    public function __construct(
        public $apiKey,
        public $url,
        public $organization,
        public $project
    ) {}

    #[\Override]
    public function text($request)
    {
        $handler = new Text($this->client(
            $request->clientOptions(),
            $request->clientRetry()
        ));

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
    public function textToSpeech($request)
    {
        $handler = new Audio($this->client(
            $request->clientOptions(),
            $request->clientRetry()
        ));

        return $handler->handleTextToSpeech($request);
    }

    #[\Override]
    public function speechToText($request)
    {
        $handler = new Audio($this->client(
            $request->clientOptions(),
            $request->clientRetry()
        ));

        return $handler->handleSpeechToText($request);
    }

    #[\Override]
    public function stream($request)
    {
        $handler = new Stream($this->client(
            $request->clientOptions(),
            $request->clientRetry()
        ));

        return $handler->handle($request);
    }

    public function handleRequestException($model, $e)
    {
        match ($e->response->getStatusCode()) {
            429     => throw RateLimitedException::make(
                $this->processRateLimits($e->response),
                (int) $e->response->header('retry-after')
            ),
            529     => throw ProviderOverloadedException::make(ProviderName::OpenAI),
            413     => throw RequestTooLargeException::make(ProviderName::OpenAI),
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

    protected function client($options = [], $retry = [], $baseUrl = null)
    {
        return $this->baseClient()
            ->withHeaders(array_filter([
                'OpenAI-Organization'   => $this->organization,
                'OpenAI-Project'        => $this->project
            ]))
            ->when($this->apiKey, fn ($client) => $client->withToken($this->apiKey))
            ->withOptions($options)
            ->when($retry !== [], fn ($client) => $client->retry(...$retry))
            ->baseUrl($baseUrl ?? self::BASE_URL);
    }

    public function info()
    {
        return [
            'id'            => ProviderName::OpenAI->value,
            'name'          => ucfirst(ProviderName::OpenAI->value),
            'description'   => 'OpenAI API with function calling support',
            'website'       => 'https://openai.com',
            'icon'          => 'https://openai.com/favicon.ico',
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
                'description' => 'OpenAI API key',
                'required' => true
            ],
            'organization' => [
                'type' => 'string',
                'description' => 'OpenAI organization',
                'required' => false
            ],
            'project' => [
                'type' => 'string',
                'description' => 'OpenAI project',
                'required' => false
            ]
        ];
    }

    public function sensitiveParameters()
    {
        return ['api_key'];
    }
}
