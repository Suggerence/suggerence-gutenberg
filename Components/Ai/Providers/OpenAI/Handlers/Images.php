<?php

namespace SuggerenceGutenberg\Components\Ai\Providers\OpenAI\Handlers;

use SuggerenceGutenberg\Components\Ai\Images\ResponseBuilder;
use SuggerenceGutenberg\Components\Ai\Providers\OpenAI\Concerns\ProcessRateLimits;
use SuggerenceGutenberg\Components\Ai\Providers\OpenAI\Concerns\ValidatesResponse;
use SuggerenceGutenberg\Components\Ai\Providers\OpenAI\Maps\ImageRequestMap;
use SuggerenceGutenberg\Components\Ai\ValueObjects\GeneratedImage;
use SuggerenceGutenberg\Components\Ai\ValueObjects\Meta;
use SuggerenceGutenberg\Components\Ai\ValueObjects\Usage;

class Images
{
    use ProcessRateLimits;
    use ValidatesResponse;

    public function __construct(protected $client) {}
    
    public function handle($request)
    {
        $response = $this->sendRequest($request);

        $this->validateResponse($response);

        $data = $response->json();

        $images = $this->extractImages($data);

        $responseBuilder = new ResponseBuilder(
            new Usage(
                data_get($data, 'usage.input_tokens', data_get($data, 'usage.prompt_tokens', 0)),
                data_get($data, 'usage.output_tokens', data_get($data, 'usage.completion_tokens', 0))
            ),
            new Meta(
                data_get($data, 'id', 'img_' . bin2hex(random_bytes(8))),
                data_get($data, 'model', $request->model()),
                $this->processRateLimits($response)
            ),
            $images
        );

        return $responseBuilder->toResponse();
    }

    protected function sendRequest($request)
    {
        if ($request->providerOptions('image')) {
            return $this->sendImageEditRequest($request);
        }

        return $this->client->post('images/generations', ImageRequestMap::map($request));
    }

    protected function sendImageEditRequest($request)
    {
        $this->client->attach(
            'image',
            $request->providerOptions('image')
        );

        if ($request->providerOptions('mask')) {
            $this->client->attach(
                'mask',
                $request->providerOptions('mask')
            );
        }

        return $this->client->post('images/edit', ImageRequestMap::map($request));
    }

    protected function extractImages($data)
    {
        $images = [];

        foreach (data_get($data, 'data', []) as $imageData) {
            $images[] = new GeneratedImage(
                data_get($imageData, 'url'),
                data_get($imageData, 'b64_json'),
                data_get($imageData, 'revised_prompt')
            );
        }

        return $images;
    }
}
