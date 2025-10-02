<?php

namespace SuggerenceGutenberg\Components\Ai\Providers\Gemini\Handlers;

use SuggerenceGutenberg\Components\Ai\Providers\Gemini\Maps\MessageMap;
use SuggerenceGutenberg\Components\Ai\Providers\Gemini\ValueObjects\GeminiCachedObject;
use SuggerenceGutenberg\Components\Ai\Helpers\Functions;

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
        $request = Functions::where_not_null([
            'model' => "models/{$this->model}",
            ...(new MessageMap($this->messages, $this->systemPrompts))(),
            'ttl'   => $this->ttl . 's'
        ]);

        $response = $this->client->post('/cachedContents', $request);

        return $response->json();
    }
}
