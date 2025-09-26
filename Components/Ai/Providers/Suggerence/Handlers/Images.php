<?php

namespace SuggerenceGutenberg\Components\Ai\Providers\Suggerence\Handlers;

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
                data_get($data, 'usage.input_tokens', data_get($data, 'usage.prompt_tokens', 0)),
                data_get($data, 'usage.output_tokens', data_get($data, 'usage.completion_tokens', 0))
            ),
            new Meta(
                data_get($data, 'id', 'img_' . bin2hex(random_bytes(8))),
                data_get($data, 'model', $request->model()),
            ),
            $images
        );

        return $responseBuilder->toResponse();
    }

    protected function sendRequest($request)
    {
        return $this->client->post('gutenberg/images', ImageRequestMap::map($request));
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
