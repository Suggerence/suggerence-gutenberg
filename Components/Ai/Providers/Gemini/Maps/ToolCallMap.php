<?php

namespace SuggerenceGutenberg\Components\Ai\Providers\Gemini\Maps;

use SuggerenceGutenberg\Components\Ai\ValueObjects\ToolCall;

class ToolCallMap
{
    public static function map($toolCalls)
    {
        if ($toolCalls === []) {
            return [];
        }

        return array_map(fn ($toolCall) => new ToolCall(
            data_get($toolCall, 'functionCall.name'),
            data_get($toolCall, 'functionCall.name'),
            data_get($toolCall, 'functionCall.args')
        ), $toolCalls);
    }
}
