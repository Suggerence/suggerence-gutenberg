<?php

namespace SuggerenceGutenberg\Components\Ai\Providers\Gemini\Maps;

use SuggerenceGutenberg\Components\Ai\Enums\Capabilities;

class CapabilitiesMapper
{
    public static function mapCapabilities($model)
    {
        $capabilities = [];

        $supportedGenerationMethods = $model['supportedGenerationMethods'];

        if (in_array('embedText', $supportedGenerationMethods)) {
            $capabilities[] = Capabilities::TEXT_EMBEDDINGS;
        }

        if (in_array('embedContent', $supportedGenerationMethods)) {
            $capabilities[] = Capabilities::MEDIA_EMBEDDINGS;
            $capabilities[] = Capabilities::TEXT_EMBEDDINGS;
        }

        if (in_array('asyncBatchEmbedContent', $supportedGenerationMethods)) {
            $capabilities[] = Capabilities::BATCH_GENERATION;
        }

        if (in_array('countTextTokens', $supportedGenerationMethods)) {
            $capabilities[] = Capabilities::RETURNS_TOKEN_USAGE;
        }

        if (in_array('countTokens', $supportedGenerationMethods)) {
            $capabilities[] = Capabilities::RETURNS_TOKEN_USAGE;
        }

        if (in_array('generateContent', $supportedGenerationMethods)) {
            $capabilities[] = Capabilities::MULTIMODAL_OUTPUT;
            $capabilities[] = Capabilities::TEXT_GENERATION;
        }

        if (in_array('createCachedContent', $supportedGenerationMethods)) {
            $capabilities[] = Capabilities::CACHED_OUTPUT;
        }

        if (in_array('batchGenerateContent', $supportedGenerationMethods)) {
            $capabilities[] = Capabilities::BATCH_GENERATION;
        }

        if (in_array('bidiGenerateContent', $supportedGenerationMethods)) {
            $capabilities[] = Capabilities::REAL_TIME_OUTPUT;
        }

        if (in_array('generateAnswer', $supportedGenerationMethods)) {
            $capabilities[] = Capabilities::TEXT_GENERATION;
        }

        if (in_array('predict', $supportedGenerationMethods)) {
            $capabilities[] = Capabilities::MULTIMODAL_OUTPUT;
        }

        if (data_get($model, 'thinking', false)) {
            $capabilities[] = Capabilities::REASONING;
        }

        return array_values(array_unique($capabilities));
    }
}
