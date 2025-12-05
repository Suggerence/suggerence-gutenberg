<?php

namespace SuggerenceGutenberg\Components\Ai\Providers\Anthropic\Concerns;

use SuggerenceGutenberg\Components\Ai\Helpers\Functions;

trait ExtractsText
{
    protected function extractText($data)
    {
        return array_reduce(Functions::data_get($data, 'content', []), function ($text, $content) {
            if (Functions::data_get($content, 'type') === 'text') {
                $text .= Functions::data_get($content, 'text');
            }

            return $text;
        }, '');
    }
}
