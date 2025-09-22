<?php

namespace SuggerenceGutenberg\Components\Ai\Providers\OpenAI\Concerns;

use Illuminate\Support\Arr;
use SuggerenceGutenberg\Components\Ai\Providers\OpenAI\Maps\CitationsMapper;

trait ExtractsCitations
{
    protected function extractCitations($responseData)
    {
        $contentBlock = data_get($responseData, 'output.{last}.content.{last}', []);

        if (data_get($contentBlock, 'annotations', []) === []) {
            return null;
        }

        return Arr::whereNotNull([CitationsMapper::mapFromOpenAI($contentBlock)]);
    }
}
