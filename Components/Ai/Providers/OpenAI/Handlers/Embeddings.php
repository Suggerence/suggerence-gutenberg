<?php

namespace SuggerenceGutenberg\Components\Ai\Providers\OpenAI\Handlers;

use SuggerenceGutenberg\Components\Ai\Providers\OpenAI\Concerns\ProcessRateLimits;
use SuggerenceGutenberg\Components\Ai\Providers\OpenAI\Concerns\ValidatesResponse;
use SuggerenceGutenberg\Components\Ai\Embeddings\Response as EmbeddingsResponse;
use SuggerenceGutenberg\Components\Ai\ValueObjects\Embedding;
use SuggerenceGutenberg\Components\Ai\ValueObjects\EmbeddingsUsage;
use SuggerenceGutenberg\Components\Ai\ValueObjects\Meta;

class Embeddings
{
    use ProcessRateLimits;
    use ValidatesResponse;
    
    public function __construct(protected $client) {}

    public function handle($request)
    {
        $response = $this->sendRequest($request);

        $this->validateResponse($response);
        
        $data = $response->json();

        return new EmbeddingsResponse(
            array_map(fn ($item) => Embedding::fromArray($item['embedding']), data_get($data, 'data', [])),
            new EmbeddingsUsage(data_get($data, 'usage.total_tokens', null)),
            new Meta(
                '',
                data_get($data, 'model', ''),
                $this->processRateLimits($response)
            )
        );
    }

    protected function sendRequest($request)
    {
        return $this->client->post(
            'embeddings',
            [
                'model' => $request->model(),
                'input' => $request->inputs(),
                ...($request->providerOptions() ?? [])
            ]
        );
    }
}
