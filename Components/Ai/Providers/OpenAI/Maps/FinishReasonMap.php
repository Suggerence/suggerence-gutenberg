<?php

namespace SuggerenceGutenberg\Components\Ai\Providers\OpenAI\Maps;

use SuggerenceGutenberg\Components\Ai\Enums\FinishReason;

class FinishReasonMap
{
    public static function map($status, $type = null)
    {
        return match ($status) {
            'incomplete'        => FinishReason::Length,
            'length'            => FinishReason::Length,
            'failed'            => FinishReason::Error,
            'completed'         => match ($type) {
                'function_call' => FinishReason::ToolCalls,
                'message'       => FinishReason::Stop,
                default         => FinishReason::Unknown
            },
            default             => FinishReason::Unknown
        };
    }
}
