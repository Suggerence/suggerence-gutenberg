<?php

namespace SuggerenceGutenberg\Components\Ai\Providers\OpenAI\Maps;

use SuggerenceGutenberg\Components\Ai\Enums\Capabilities;

class CapabilitiesMapper
{
    public static function mapCapabilities($modelId)
    {
        return match ($modelId) {
            'gpt-4o' => [
                Capabilities::TEXT_GENERATION,
                Capabilities::FUNCTION_CALLING,
                Capabilities::CHAT_HISTORY,
                Capabilities::MULTIMODAL_INPUT,
                Capabilities::MULTIMODAL_OUTPUT
            ],
            'gpt-4o-mini' => [
                Capabilities::TEXT_GENERATION,
                Capabilities::FUNCTION_CALLING,
                Capabilities::CHAT_HISTORY,
                Capabilities::MULTIMODAL_INPUT,
                Capabilities::MULTIMODAL_OUTPUT
            ],
            'gpt-4-turbo' => [
                Capabilities::TEXT_GENERATION,
                Capabilities::FUNCTION_CALLING,
                Capabilities::CHAT_HISTORY,
                Capabilities::MULTIMODAL_INPUT,
                Capabilities::MULTIMODAL_OUTPUT
            ],
            'gpt-3.5-turbo' => [
                Capabilities::TEXT_GENERATION,
                Capabilities::FUNCTION_CALLING,
                Capabilities::CHAT_HISTORY
            ],
            default => null
        };
    }
}
