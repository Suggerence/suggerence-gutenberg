<?php

namespace SuggerenceGutenberg\Components\Ai\Providers\OpenAI\Handlers;

use SuggerenceGutenberg\Components\Ai\Models\Model;
use SuggerenceGutenberg\Components\Ai\Models\ResponseBuilder;
use SuggerenceGutenberg\Components\Ai\Providers\OpenAI\Concerns\ValidatesResponse;
use SuggerenceGutenberg\Components\Ai\Enums\Provider as ProviderName;
use SuggerenceGutenberg\Components\Ai\Providers\OpenAI\Maps\CapabilitiesMapper;
use SuggerenceGutenberg\Components\Ai\Helpers\Functions;

class Models
{
    use ValidatesResponse;

    protected $responseBuilder;

    public function __construct(protected $client) {
        $this->responseBuilder = new ResponseBuilder;
    }

    public function handle()
    {
        $response = $this->sendRequest();

        $this->validateResponse($response);

        $data = $response->json();

        $models = Functions::data_get($data, 'data', []);

        foreach ($models as $model) {
            $this->responseBuilder->addModel(new Model(
                $model['id'],
                strtoupper($model['id'] ?? ''),
                ProviderName::OpenAI,
                str_replace('-', ' ', ucfirst($model['owned_by'] ?? ProviderName::OpenAI)),
                CapabilitiesMapper::mapCapabilities($model['id']),
                isset($model['created']) ? date('Y/m/d', $model['created']) : null
            ));
        }

        return $this->responseBuilder->toResponse();
    }

    public function sendRequest()
    {
        return $this->client->get('models');
    }
}
