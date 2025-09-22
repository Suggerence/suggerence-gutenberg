<?php

namespace SuggerenceGutenberg\Components\Ai\Providers\Anthropic\Handlers;

use SuggerenceGutenberg\Components\Ai\Exceptions\Exception;
use SuggerenceGutenberg\Components\Ai\Models\Model;
use SuggerenceGutenberg\Components\Ai\Models\ResponseBuilder;
use SuggerenceGutenberg\Components\Ai\Providers\Anthropic\Maps\CapabilitiesMapper;
use SuggerenceGutenberg\Components\Ai\Enums\Provider as ProviderName;

class Models
{
    protected $responseBuilder;

    public function __construct(protected $client) {
        $this->responseBuilder = new ResponseBuilder;
    }

    public function handle()
    {
        $response = $this->sendRequest();

        $data = $response->json();

        if (!$this->validateResponse($data)) {
            throw new Exception('Invalid response from Anthropic');
        }

        $models = data_get($data, 'data', []);

        foreach ($models as $model) {
            $this->responseBuilder->addModel(new Model(
                $model['id'],
                $model['display_name'],
                ProviderName::Anthropic,
                ucfirst(ProviderName::Anthropic->value),
                CapabilitiesMapper::mapCapabilities($model['id'])
            ));
        }

        return $this->responseBuilder->toResponse();
    }

    public function sendRequest()
    {
        return $this->client
            ->withQueryParameters(['limit' => 100])
            ->get('models');
    }

    public function validateResponse($response)
    {
        return isset($response['data']) && is_array($response['data']);
    }
}
