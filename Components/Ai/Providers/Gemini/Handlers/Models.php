<?php

namespace SuggerenceGutenberg\Components\Ai\Providers\Gemini\Handlers;

use SuggerenceGutenberg\Components\Ai\Exceptions\Exception;
use SuggerenceGutenberg\Components\Ai\Models\Model;
use SuggerenceGutenberg\Components\Ai\Models\ResponseBuilder;
use SuggerenceGutenberg\Components\Ai\Enums\Provider as ProviderName;
use SuggerenceGutenberg\Components\Ai\Providers\Gemini\Maps\CapabilitiesMapper;
use SuggerenceGutenberg\Components\Ai\Helpers\Functions;

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
            throw new Exception('Invalid response from Gemini');
        }

        $models = Functions::data_get($data, 'models', []);

        foreach ($models as $model) {
            $this->responseBuilder->addModel(new Model(
                isset($model['name']) ? (strpos($model['name'], '/') !== false ? substr(strrchr($model['name'], '/'), 1) : $model['name']) : '',
                $model['displayName'],
                ProviderName::Gemini,
                ucfirst(ProviderName::Gemini->value),
                CapabilitiesMapper::mapCapabilities($model)
            ));
        }

        return $this->responseBuilder->toResponse();
    }

    public function sendRequest()
    {
        return $this->client->get('models');
    }

    public function validateResponse($response)
    {
        return isset($response['models']) && is_array($response['models']);
    }
}
