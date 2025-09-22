<?php

namespace SuggerenceGutenberg\Components\Ai\Providers\Anthropic\Maps;

use InvalidArgumentException;
use SuggerenceGutenberg\Components\Ai\Enums\ToolChoice;

class ToolChoiceMap
{
    public static function map($toolChoice)
    {
        if (is_null($toolChoice)) {
            return null;
        }

        if (is_string($toolChoice)) {
            return ['type' => 'tool', 'name' => $toolChoice];
        }

        if (!in_array($toolChoice, [ToolChoice::Auto, ToolChoice::Any, ToolChoice::None])) {
            throw new InvalidArgumentException('Invalid tool choice');
        }

        return [
            'type' => match ($toolChoice) {
                ToolChoice::Auto    => 'auto',
                ToolChoice::Any     => 'any',
                ToolChoice::None    => 'none'
            },
        ];
    }
}
