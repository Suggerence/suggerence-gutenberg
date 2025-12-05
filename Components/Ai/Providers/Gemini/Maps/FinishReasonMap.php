<?php

namespace SuggerenceGutenberg\Components\Ai\Providers\Gemini\Maps;

use SuggerenceGutenberg\Components\Ai\Enums\FinishReason;

class FinishReasonMap
{
    public static function map($finishReason, $toolCall = false)
    {
        return match ($finishReason) {
            'STOP'                                                                          => $toolCall ? FinishReason::ToolCalls : FinishReason::Stop,
            'MAX_TOKENS'                                                                    => FinishReason::Length,
            'SAFETY', 'BLOCKLIST', 'PROHIBITED_CONTENT', 'SPII', 'MALFORMED_FUNCTION_CALL'  => FinishReason::ContentFilter,
            'RECITATION'                                                                    => FinishReason::ContentFilter,
            'LANGUAGE'                                                                      => FinishReason::Other,
            'FINISH_REASON_UNSPECIFIED', 'OTHER', null                                      => FinishReason::Other,
            default                                                                         => FinishReason::Other
        };
    }
}
