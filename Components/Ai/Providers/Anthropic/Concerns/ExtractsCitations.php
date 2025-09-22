<?php

namespace SuggerenceGutenberg\Components\Ai\Providers\Anthropic\Concerns;

use Illuminate\Support\Arr;

use SuggerenceGutenberg\Components\Ai\Providers\Anthropic\Maps\CitationsMapper;

trait ExtractsCitations
{
    protected function extractCitations($data)
    {
        if (data_get($data, 'content.*.citations', []) === []) {
            return null;
        }

        return array_values(Arr::whereNotNull(
            Arr::map(data_get($data, 'content', []), fn ($contentBlock) => CitationsMapper::mapFromAnthropic($contentBlock))
        ));
    }
}
