<?php

namespace SuggerenceGutenberg\Components\Ai\Providers\Anthropic\Concerns;

use SuggerenceGutenberg\Components\Ai\Providers\Anthropic\Maps\CitationsMapper;
use SuggerenceGutenberg\Components\Ai\Helpers\Functions;

trait ExtractsCitations
{
    protected function extractCitations($data)
    {
        if (Functions::data_get($data, 'content.*.citations', []) === []) {
            return null;
        }

        return array_values(Functions::where_not_null(
            Functions::arr_map(Functions::data_get($data, 'content', []), fn ($contentBlock) => CitationsMapper::mapFromAnthropic($contentBlock))
        ));
    }
}
