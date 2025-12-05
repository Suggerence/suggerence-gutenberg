<?php

namespace SuggerenceGutenberg\Components\Ai\Providers\Anthropic\Concerns;

use SuggerenceGutenberg\Components\Ai\Helpers\Functions;

trait ExtractsThinking
{
    protected function extractThinking($data)
    {
        if ($this->request->providerOptions('thinking.enabled') !== true) {
            return [];
        }

        $thinking = Functions::arr_first(
            Functions::data_get($data, 'content', []),
            fn ($content) => Functions::data_get($content, 'type') === 'thinking'
        );

        return [
            'thinking'              => Functions::data_get($thinking, 'thinking'),
            'thinking_signature'    => Functions::data_get($thinking, 'signature')
        ];
    }
}
