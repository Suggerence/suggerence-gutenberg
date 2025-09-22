<?php

namespace SuggerenceGutenberg\Components\Ai\Providers\Gemini\Handlers;

use SuggerenceGutenberg\Components\Ai\Images\ResponseBuilder;
use SuggerenceGutenberg\Components\Ai\Providers\Gemini\Concerns\ValidatesResponse;
use SuggerenceGutenberg\Components\Ai\Providers\Gemini\Maps\ImageRequestMap;
use SuggerenceGutenberg\Components\Ai\ValueObjects\GeneratedImage;
use SuggerenceGutenberg\Components\Ai\ValueObjects\Meta;
use SuggerenceGutenberg\Components\Ai\ValueObjects\Usage;

class Images
{
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
                data_get($data, 'usageMetadata.promptTokenCount', 0),
                data_get($data, 'usageMetadata.candidatesTokenCount', 0)
            ),
            new Meta(
                data_get($data, 'responseId', data_get($data, 'id', '')),
                data_get($data, 'modelVersion', '')
            ),
            $images
        );

        return $responseBuilder->toResponse();
    }

    protected function sendRequest($request)
    {
        $modelEndpoint = $request->model();
        $modelEndpoint .= (str_contains($request->model(), 'gemini') ? ':generateContent' : ':predict');

        return $this->client->post("models/{$modelEndpoint}", ImageRequestMap::map($request));
    }

    protected function extractImages($data)
    {
        $imageParts = data_get($data, 'predictions', []);
        if (empty($imageParts)) {
            $parts      = data_get($data, 'candidates.0.content.parts', []);
            $imageParts = array_column(
                array_filter($parts, fn ($part) => data_get($part, 'inlineData.data')),
                'inlineData'
            );
        }

        return array_map(fn ($image) => new GeneratedImage(
            null,
            data_get($image, 'bytesBase64Encoded', data_get($image, 'data')),
            null,
            data_get($image, 'mimeType')
        ), $imageParts);
    }
}
