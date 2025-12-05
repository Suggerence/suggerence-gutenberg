<?php

namespace SuggerenceGutenberg\Components\Ai\Providers\Gemini\Handlers;

use SuggerenceGutenberg\Components\Ai\Images\ResponseBuilder;
use SuggerenceGutenberg\Components\Ai\Providers\Gemini\Concerns\ValidatesResponse;
use SuggerenceGutenberg\Components\Ai\Providers\Gemini\Maps\ImageRequestMap;
use SuggerenceGutenberg\Components\Ai\ValueObjects\GeneratedImage;
use SuggerenceGutenberg\Components\Ai\ValueObjects\Meta;
use SuggerenceGutenberg\Components\Ai\ValueObjects\Usage;
use SuggerenceGutenberg\Components\Ai\Helpers\Functions;

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
                Functions::data_get($data, 'usageMetadata.promptTokenCount', 0),
                Functions::data_get($data, 'usageMetadata.candidatesTokenCount', 0)
            ),
            new Meta(
                Functions::data_get($data, 'responseId', Functions::data_get($data, 'id', '')),
                Functions::data_get($data, 'modelVersion', '')
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
        $imageParts = Functions::data_get($data, 'predictions', []);
        if (empty($imageParts)) {
            $parts      = Functions::data_get($data, 'candidates.0.content.parts', []);
            $imageParts = array_column(
                array_filter($parts, fn ($part) => Functions::data_get($part, 'inlineData.data')),
                'inlineData'
            );
        }

        return array_map(fn ($image) => new GeneratedImage(
            null,
            Functions::data_get($image, 'bytesBase64Encoded', Functions::data_get($image, 'data')),
            null,
            Functions::data_get($image, 'mimeType')
        ), $imageParts);
    }
}
