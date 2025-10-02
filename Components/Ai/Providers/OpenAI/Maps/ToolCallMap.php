<?php

namespace SuggerenceGutenberg\Components\Ai\Providers\OpenAI\Maps;

use SuggerenceGutenberg\Components\Ai\ValueObjects\ToolCall;
use SuggerenceGutenberg\Components\Ai\Helpers\Functions;

class ToolCallMap
{
    public static function map($toolCalls, $reasonings = null)
    {
        if ($toolCalls === null) {
            return [];
        }

        return array_map(fn ($toolCall) => new ToolCall(
            Functions::data_get($toolCall, 'id'),
            Functions::data_get($toolCall, 'name'),
            Functions::data_get($toolCall, 'arguments'),
            Functions::data_get($toolCall, 'call_id'),
            Functions::data_get($reasonings, '0.id'),
            Functions::data_get($reasonings, '0.summary')
        ), $toolCalls);
    }
}
