<?php

namespace SuggerenceGutenberg\Components\Ai\Providers\Gemini\Handlers;

use Illuminate\Support\Arr;
use SuggerenceGutenberg\Components\Ai\Providers\Gemini\Maps\MessageMap;
use SuggerenceGutenberg\Components\Ai\Providers\Gemini\ValueObjects\GeminiCachedObject;

class Cache
{
    public function __construct(
        protected $client,
        protected $model,
        protected $messages,
        protected $systemPrompts,
        protected $ttl = null
    ) {}

    public function handle()
    {
        return GeminiCachedObject::fromResponse($this->model, $this->sendRequest());
    }

    protected function sendRequest()
    {
        $request = Arr::whereNotNull([
            'model' => "models/{$this->model}",
            ...(new MessageMap($this->messages, $this->systemPrompts))(),
            'ttl'   => $this->ttl . 's'
        ]);

        $response = $this->client->post('/cachedContents', $request);

        return $response->json();
    }
}
