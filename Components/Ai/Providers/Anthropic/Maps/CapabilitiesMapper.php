<?php

namespace SuggerenceGutenberg\Components\Ai\Providers\Anthropic\Maps;

use SuggerenceGutenberg\Components\Ai\Enums\Capabilities;

class CapabilitiesMapper
{
    public static function mapCapabilities($modelId)
    {
        return match ($modelId) {
            'claude-3-5-sonnet-20241022' => [
                Capabilities::TEXT_GENERATION,
                Capabilities::FUNCTION_CALLING,
                Capabilities::CHAT_HISTORY,
                Capabilities::MULTIMODAL_INPUT,
                Capabilities::MULTIMODAL_OUTPUT
            ],
            'claude-3-5-haiku-20241022' => [
                Capabilities::TEXT_GENERATION,
                Capabilities::FUNCTION_CALLING,
                Capabilities::CHAT_HISTORY,
                Capabilities::MULTIMODAL_INPUT,
                Capabilities::MULTIMODAL_OUTPUT
            ],
            'claude-3-opus-20240229' => [
                Capabilities::TEXT_GENERATION,
                Capabilities::FUNCTION_CALLING,
                Capabilities::CHAT_HISTORY,
                Capabilities::MULTIMODAL_INPUT,
                Capabilities::MULTIMODAL_OUTPUT
            ],
            'claude-3-sonnet-20240229' => [
                Capabilities::TEXT_GENERATION,
                Capabilities::FUNCTION_CALLING,
                Capabilities::CHAT_HISTORY,
                Capabilities::MULTIMODAL_INPUT,
                Capabilities::MULTIMODAL_OUTPUT
            ],
            'claude-3-haiku-20240307' => [
                Capabilities::TEXT_GENERATION,
                Capabilities::FUNCTION_CALLING,
                Capabilities::CHAT_HISTORY,
                Capabilities::MULTIMODAL_INPUT,
                Capabilities::MULTIMODAL_OUTPUT
            ],
            default => null
        };
    }
}
