<?php

namespace SuggerenceGutenberg\Components\Ai\Providers\Gemini\Maps;

use SuggerenceGutenberg\Components\Ai\Enums\ToolChoice;

class ToolChoiceMap
{
    public static function map($toolChoice)
    {
        if (is_string($toolChoice)) {
            return [
                'function_calling_config' => [
                    'mode'                      => 'ANY',
                    'allowed_function_names'    => [$toolChoice]
                ]
            ];
        }

        return match ($toolChoice) {
            ToolChoice::Any     => ['function_calling_config' => ['mode' => 'ANY']],
            ToolChoice::Auto    => ['function_calling_config' => ['mode' => 'AUTO']],
            ToolChoice::None    => ['function_calling_config' => ['mode' => 'NONE']],
            null                => $toolChoice,
        };
    }
}
