<?php

namespace SuggerenceGutenberg\Components\Ai\Providers\Gemini\Maps;

use SuggerenceGutenberg\Components\Ai\ValueObjects\ToolCall;
use SuggerenceGutenberg\Components\Ai\Helpers\Functions;

class ToolCallMap
{
    public static function map($toolCalls)
    {
        if ($toolCalls === []) {
            return [];
        }

        return array_map(fn ($toolCall) => new ToolCall(
            Functions::data_get($toolCall, 'functionCall.name'),
            Functions::data_get($toolCall, 'functionCall.name'),
            Functions::data_get($toolCall, 'functionCall.args')
        ), $toolCalls);
    }
}
