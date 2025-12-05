<?php

namespace SuggerenceGutenberg\Components\Ai\Providers\Suggerence\Maps;

use SuggerenceGutenberg\Components\Ai\Enums\FinishReason;

class FinishReasonMap
{
    public static function map($finishReason)
    {
        return match ($finishReason) {
            'stop'                                                                          => FinishReason::Stop,
            'tool-calls'                                                                    => FinishReason::ToolCalls,
            'max-tokens'                                                                    => FinishReason::Length,
            'safety', 'blocklist', 'prohibited-content', 'spii', 'malformed-function-call'  => FinishReason::ContentFilter,
            'recitation'                                                                    => FinishReason::ContentFilter,
            'language'                                                                      => FinishReason::Other,
            'finish-reason-unspecified', 'other', null                                      => FinishReason::Other,
            default                                                                         => FinishReason::Other
        };
    }
}
