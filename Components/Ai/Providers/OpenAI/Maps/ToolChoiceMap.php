<?php

namespace SuggerenceGutenberg\Components\Ai\Providers\OpenAI\Maps;

use SuggerenceGutenberg\Components\Ai\Enums\ToolChoice;

class ToolChoiceMap
{
    public static function map($toolChoice)
    {
        if (is_string($toolChoice)) {
            return ['type' => 'function', 'name' => $toolChoice];
        }

        return match ($toolChoice) {
            ToolChoice::Auto    => 'auto',
            ToolChoice::Any     => 'any',
            ToolChoice::None    => 'none',
            null                => $toolChoice,
        };
    }
}
