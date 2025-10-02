<?php

namespace SuggerenceGutenberg\Components\Ai\Providers\Suggerence\Handlers;

use SuggerenceGutenberg\Components\Ai\Images\ResponseBuilder;
use SuggerenceGutenberg\Components\Ai\Providers\Gemini\Concerns\ValidatesResponse;
use SuggerenceGutenberg\Components\Ai\Providers\Suggerence\Maps\ImageRequestMap;
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
                Functions::data_get($data, 'usage.input_tokens', Functions::data_get($data, 'usage.prompt_tokens', 0)),
                Functions::data_get($data, 'usage.output_tokens', Functions::data_get($data, 'usage.completion_tokens', 0))
            ),
            new Meta(
                Functions::data_get($data, 'id', 'img_' . bin2hex(random_bytes(8))),
                Functions::data_get($data, 'model', $request->model()),
            ),
            $images
        );

        return $responseBuilder->toResponse();
    }

    protected function sendRequest($request)
    {
        $response = $this->client->post('gutenberg/image', ImageRequestMap::map($request));
        return $response;
    }

    protected function extractImages($data)
    {
        // Handle response from our Suggerence API (which returns Google's format)
        $imageParts = Functions::data_get($data, 'generatedImages', []);
        
        // Fallback to other possible formats
        if (empty($imageParts)) {
            $imageParts = Functions::data_get($data, 'predictions', []);
        }
        
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
