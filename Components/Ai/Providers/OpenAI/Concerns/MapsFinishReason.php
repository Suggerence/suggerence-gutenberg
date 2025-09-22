<?php

namespace SuggerenceGutenberg\Components\Ai\Providers\OpenAI\Concerns;

use SuggerenceGutenberg\Components\Ai\Providers\OpenAI\Maps\FinishReasonMap;

trait MapsFinishReason
{
    protected function mapFinishReason($data)
    {
        return FinishReasonMap::map(
            data_get($data, 'output.{last}.status', ''),
            data_get($data, 'output.{last}.type', '')
        );
    }
}
