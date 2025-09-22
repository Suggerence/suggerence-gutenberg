<?php

namespace SuggerenceGutenberg\Components\Ai\Providers\Gemini\Maps;

use SuggerenceGutenberg\Components\Ai\Enums\Citations\CitationSourceType;
use SuggerenceGutenberg\Components\Ai\ValueObjects\Citation;
use SuggerenceGutenberg\Components\Ai\ValueObjects\MessagePartWithCitations;

class CitationMapper
{
    public static function mapFromGemini($candidate)
    {
        $lastWrittenCharacter = -1;
        $messageParts = [];

        $originalOutput     = data_get($candidate, 'content.parts.0.text');

        $groundingSupports  = data_get($candidate, 'groundingMetadata.groundingSupports', []);

        $groundingChunks    = data_get($candidate, 'groundingMetadata.groundingChunks', []);

        foreach ($groundingSupports as $groundingSupport) {
            $startIndex     = data_get($groundingSupport, 'segment.startIndex');
            $endIndex       = data_get($groundingSupport, 'segment.endIndex');

            if ($startIndex - 1 > $lastWrittenCharacter) {
                $messageParts[] = new MessagePartWithCitations(
                    substr((string) $originalOutput, $lastWrittenCharacter + 1, $startIndex - $lastWrittenCharacter - 1),
                    []
                );

                $lastWrittenCharacter = $startIndex - 1;
            }

            $messageParts[] = new MessagePartWithCitations(
                substr((string) $originalOutput, $startIndex, $endIndex - $startIndex + 1),
                self::mapGroundingChunkIndicesToCitations(
                    data_get($groundingSupport, 'groundingChunkIndices', []),
                    $groundingChunks
                )
            );
            
            $lastWrittenCharacter = $endIndex;
        }

        return $messageParts;
    }

    protected static function mapGroundingChunkIndicesToCitations($groundingChunkIndices, $groundingChunks)
    {
        return array_map(
            fn ($value) => new Citation(
                CitationSourceType::Url,
                data_get($groundingChunks, "{$value}.web.uri"),
                null,
                data_get($groundingChunks, "{$value}.web.title")
            ),
            $groundingChunkIndices
        );
    }
}
