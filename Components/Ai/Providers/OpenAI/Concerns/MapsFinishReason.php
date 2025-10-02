<?php

namespace SuggerenceGutenberg\Components\Ai\Providers\OpenAI\Concerns;

use SuggerenceGutenberg\Components\Ai\Providers\OpenAI\Maps\FinishReasonMap;
use SuggerenceGutenberg\Components\Ai\Helpers\Functions;

trait MapsFinishReason
{
    protected function mapFinishReason($data)
    {
        return FinishReasonMap::map(
            Functions::data_get($data, 'output.{last}.status', ''),
            Functions::data_get($data, 'output.{last}.type', '')
        );
    }
}
