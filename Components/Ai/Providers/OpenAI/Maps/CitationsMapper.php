<?php

namespace SuggerenceGutenberg\Components\Ai\Providers\OpenAI\Maps;

use InvalidArgumentException;
use SuggerenceGutenberg\Components\Ai\Enums\Citations\CitationSourceType;
use SuggerenceGutenberg\Components\Ai\ValueObjects\Citation;
use SuggerenceGutenberg\Components\Ai\ValueObjects\MessagePartWithCitations;

class CitationsMapper
{
    public static function mapFromOpenAI($contentBlock)
    {
        if (!isset($contentBlock['type']) || $contentBlock['type'] !== 'output_text') {
            return null;
        }

        $citations = array_map(
            fn ($citationData) => self::mapCitation($citationData),
            $contentBlock['annotations'] ?? []
        );

        return new MessagePartWithCitations(
            $contentBlock['text'] ?? '',
            $citations
        );
    }

    public static function mapToOpenAI($messagePartWithCitations)
    {
        $annotations = array_map(
            fn ($citation) => self::mapCitationToOpenAI($citation),
            $messagePartWithCitations->citations
        );

        return [
            'type'          => 'output_text',
            'text'          => $messagePartWithCitations->outputText,
            'annotations'   => $annotations
        ];
    }

    protected static function mapCitation($citationData)
    {
        return new Citation(
            $sourceType = self::mapSourceType($citationData['type']),
            self::mapSource($citationData, $sourceType),
            null,
            $citationData['title'] ?? null,
            null,
            null,
            null,
            [
                'responseStartIndex'    => $citationData['start_index'] ?? null,
                'responseEndIndex'      => $citationData['end_index'] ?? null,
            ]
        );
    }

    protected static function mapSourceType($openaiType)
    {
        return match ($openaiType) {
            'file_citation' => CitationSourceType::Document,
            'url_citation'  => CitationSourceType::Url,
            default         => throw new InvalidArgumentException("Unknown citation source type: {$openaiType}")
        };
    }

    protected static function mapSource($citationData, $sourceType)
    {
        if ($sourceType === CitationSourceType::Document) {
            return isset($citationData['filename'], $citationData['index'])
                ? $citationData['filename'] . ':' . $citationData['index']
                : $citationData['filename'] ?? '';
        }

        return $citationData['url'] ?? '';
    }

    protected static function mapCitationToOpenAI($citation)
    {
        return [
            'type'          => 'url_citation',
            'start_index'   => data_get($citation->additionalContent, 'responseStartIndex'),
            'end_index'     => data_get($citation->additionalContent, 'responseEndIndex'),
            'url'           => $citation->source,
            'title'         => $citation->sourceTitle,
        ];
    }
}
