<?php

namespace SuggerenceGutenberg\Components\Ai\Providers\Gemini\Handlers;

use SuggerenceGutenberg\Components\Ai\Embeddings\Response as EmbeddingsResponse;
use SuggerenceGutenberg\Components\Ai\Exceptions\Exception;
use SuggerenceGutenberg\Components\Ai\ValueObjects\Embedding;
use SuggerenceGutenberg\Components\Ai\ValueObjects\EmbeddingsUsage;
use SuggerenceGutenberg\Components\Ai\ValueObjects\Meta;
use SuggerenceGutenberg\Components\Ai\Helpers\Functions;

class Embeddings
{
    public function __construct(protected $client) {}

    public function handle($request)
    {
        if (count($request->inputs()) > 1) {
            throw new Exception('Gemini Error: We currently only support one input at a time with Gemini.');
        }

        $response = $this->sendRequest($request);

        $data = $response->json();

        if (!isset($data['embedding'])) {
            throw Exception::providerResponseError('Gemini Error: Invalid response format or missing embedding data');
        }

        return new EmbeddingsResponse(
            [Embedding::fromArray(Functions::data_get($data, 'embedding.values', []))],
            new EmbeddingsUsage(0), // No token usage information available on Gemini
            new Meta('', '')
        );
    }

    protected function sendRequest($request)
    {
        $providerOptions = $request->providerOptions();

        return $this->client->post(
            "models/{$request->model()}:embedContent",
            Functions::where_not_null([
                'model'                 => $request->model(),
                'content'               => [
                    'parts' => [
                        ['text' => $request->inputs()[0]]
                    ]
                ],
                'title'                 => $providerOptions['title'] ?? null,
                'taskType'              => $providerOptions['taskType'] ?? null,
                'outputDimensionality'  => $providerOptions['outputDimensionality'] ?? null
            ])
        );
    }
}
