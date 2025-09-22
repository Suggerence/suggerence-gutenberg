<?php

namespace SuggerenceGutenberg\Components\Ai\Providers\Anthropic\Concerns;

trait ExtractsText
{
    protected function extractText($data)
    {
        return array_reduce(data_get($data, 'content', []), function ($text, $content) {
            if (data_get($content, 'type') === 'text') {
                $text .= data_get($content, 'text');
            }

            return $text;
        }, '');
    }
}
