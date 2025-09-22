<?php

namespace SuggerenceGutenberg\Components\Ai\Providers\OpenAI\Maps;

use SuggerenceGutenberg\Components\Ai\ValueObjects\ToolCall;

class ToolCallMap
{
    public static function map($toolCalls, $reasonings = null)
    {
        if ($toolCalls === null) {
            return [];
        }

        return array_map(fn ($toolCall) => new ToolCall(
            data_get($toolCall, 'id'),
            data_get($toolCall, 'name'),
            data_get($toolCall, 'arguments'),
            data_get($toolCall, 'call_id'),
            data_get($reasonings, '0.id'),
            data_get($reasonings, '0.summary')
        ), $toolCalls);
    }
}
