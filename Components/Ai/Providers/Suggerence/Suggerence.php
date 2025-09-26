<?php

namespace SuggerenceGutenberg\Components\Ai\Providers\Suggerence;

use SuggerenceGutenberg\Components\Ai\Concerns\InitializesClient;
use SuggerenceGutenberg\Components\Ai\Concerns\IsConfigurable;
use SuggerenceGutenberg\Components\Ai\Providers\Suggerence\Handlers\Images;
use SuggerenceGutenberg\Components\Ai\Providers\Suggerence\Handlers\Text;
use SuggerenceGutenberg\Components\Ai\Providers\Provider;
use SuggerenceGutenberg\Components\Ai\Enums\Provider as ProviderName;

class Suggerence extends Provider
{
    use InitializesClient, IsConfigurable;

    const BASE_URL = 'https://api.suggerence.com/v1';

    public function __construct(
        public $apiKey
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

        return $handler->handle($request);
    }

    public function images($request)
    {
        $handler = new Images($this->client(
            $request->clientOptions(),
            $request->clientRetry()
        ));

        return $handler->handle($request);
    }

    public function models()
    {
        return [];
    }
    
    public function handleRequestException($model, $e)
    {
        throw $e;
    }
    
    protected function client($options = [], $retry = [], $baseUrl = null)
    {
        return $this->baseClient()
            ->withHeaders(['Authorization' => 'Bearer ' . $this->apiKey])
            ->withOptions($options)
            ->when($retry !== [], fn ($client) => $client->retry(...$retry))
            ->baseUrl($baseUrl ?? self::BASE_URL);
    }

    public function info()
    {
        return [
            'id'            => ProviderName::Suggerence->value,
            'name'          => ucfirst(ProviderName::Suggerence->value),
            'description'   => 'Suggerence models with function calling support',
            'website'       => 'https://suggerence.com',
            'icon'          => 'https://suggerence.com/wp-content/uploads/2025/08/suggerence-e1755678856359.png',
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
                'description' => 'Suggerence API key',
                'required' => true
            ]
        ];
    }

    public function sensitiveParameters()
    {
        return ['api_key'];
    }
}
