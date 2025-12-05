<?php

namespace SuggerenceGutenberg\Components\Ai\Providers\Anthropic\Maps;

use SuggerenceGutenberg\Components\Ai\Enums\FinishReason;

class FinishReasonMap
{
    public static function map($reason)
    {
        return match ($reason) {
            'end_turn', 'stop_sequence' => FinishReason::Stop,
            'tool_use'                  => FinishReason::ToolCalls,
            'max_tokens'                => FinishReason::Length,
            default                     => FinishReason::Unknown
        };
    }
}
