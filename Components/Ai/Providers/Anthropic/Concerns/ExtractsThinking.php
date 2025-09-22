<?php

namespace SuggerenceGutenberg\Components\Ai\Providers\Anthropic\Concerns;

use Illuminate\Support\Arr;

trait ExtractsThinking
{
    protected function extractThinking($data)
    {
        if ($this->request->providerOptions('thinking.enabled') !== true) {
            return [];
        }

        $thinking = Arr::first(
            data_get($data, 'content', []),
            fn ($content) => data_get($content, 'type') === 'thinking'
        );

        return [
            'thinking'              => data_get($thinking, 'thinking'),
            'thinking_signature'    => data_get($thinking, 'signature')
        ];
    }
}
