<?php

namespace SuggerenceGutenberg\Components\Ai\Providers\OpenAI\Concerns;

use SuggerenceGutenberg\Components\Ai\Providers\OpenAI\Maps\CitationsMapper;
use SuggerenceGutenberg\Components\Ai\Helpers\Functions;

trait ExtractsCitations
{
    protected function extractCitations($responseData)
    {
        $contentBlock = Functions::data_get($responseData, 'output.{last}.content.{last}', []);

        if (Functions::data_get($contentBlock, 'annotations', []) === []) {
            return null;
        }

        return Functions::where_not_null([CitationsMapper::mapFromOpenAI($contentBlock)]);
    }
}
