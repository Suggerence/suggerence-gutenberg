<?php

namespace SuggerenceGutenberg\Components\Ai\Providers\Anthropic\Maps;

use Illuminate\Support\Arr;

use SuggerenceGutenberg\Components\Ai\ValueObjects\MessagePartWithCitations;
use SuggerenceGutenberg\Components\Ai\ValueObjects\Citation;
use SuggerenceGutenberg\Components\Ai\Enums\Citations\CitationSourceType;
use SuggerenceGutenberg\Components\Ai\Enums\Citations\CitationSourcePositionType;

use InvalidArgumentException;

class CitationsMapper
{
    public static function mapFromAnthropic($contentBlock)
    {
        if (!isset($contentBlock['type']) || $contentBlock['type'] !== 'text') {
            return null;
        }

        $citations = array_map(
            fn ($citationData) => self::mapCitationFromAnthropic($citationData),
            $contentBlock['citations'] ?? []
        );

        return new MessagePartWithCitations(
            $contentBlock['text'] ?? '',
            $citations
        );
    }

    public static function mapToAnthropic($messagePartWithCitations)
    {
        $citations = array_map(
            fn ($citation) => self::mapCitationToAnthropic($citation),
            $messagePartWithCitations->citations
        );

        return array_filter([
            'type'      => 'text',
            'text'      => $messagePartWithCitations->outputText,
            'citations' => $citations ?: null
        ]);
    }

    public static function mapCitationFromAnthropic($citationData)
    {
        $sourceType         = self::mapSourceType($citationData['type']);
        $source             = self::mapSource($citationData, $sourceType);
        $sourcePositionType = self::mapSourcePositionType($citationData['type']);

        $indices            = self::mapIndices($citationData);
        $startIndex         = $indices['start'] ?? null;
        $endIndex           = $indices['end'] ?? null;

        return new Citation(
            $sourceType,
            $source,
            $citationData['cited_text'] ?? null,
            $citationData['document_title'] ?? $citationData['title'] ?? null,
            $sourcePositionType,
            $startIndex,
            $endIndex,
            Arr::whereNotNull([
                'encrypted_index' => data_get($citationData, 'encrypted_index')
            ])
        );
    }

    protected static function mapSourceType($anthropicType)
    {
        return match ($anthropicType) {
            'web_search_result_location'                                => CitationSourceType::Url,
            'page_location', 'char_location', 'content_block_location'  => CitationSourceType::Document,
            default                                                     => throw new InvalidArgumentException("Unknown citation type: {$anthropicType}")
        };
    }

    protected static function mapSource($citationData, $sourceType)
    {
        if ($sourceType === CitationSourceType::Url) {
            return $citationData['url'] ?? '';
        }

        return $citationData['document_index'] ?? 0;
    }

    protected static function mapSourcePositionType($anthropicType)
    {
        return match ($anthropicType) {
            'page_location'                 => CitationSourcePositionType::Page,
            'char_location'                 => CitationSourcePositionType::Character,
            'content_block_location'        => CitationSourcePositionType::Chunk,
            'web_search_result_location'    => null,
            default                         => null
        };
    }

    protected static function mapIndices($citationData)
    {
        $indexPropertyCommonPart = match ($citationData['type']) {
            'page_location'                 => 'page_number',
            'char_location'                 => 'char_index',
            'content_block_location'        => 'block_index',
            'web_search_result_location'    => null,
            default                         => null
        };

        if ($indexPropertyCommonPart === null) {
            return ['start' => null, 'end' => null];
        }

        return [
            'start' => $citationData["start_$indexPropertyCommonPart"] ?? null,
            'end'   => $citationData["end_$indexPropertyCommonPart"] ?? null
        ];
    }

    protected static function mapCitationToAnthropic($citation)
    {
        $anthropicType  = self::mapSourcePositionTypeToAnthropic($citation->sourcePositionType);
        $indices        = self::mapIndicesToAnthropic($citation, $anthropicType);

        $result = [
            'type'          => $anthropicType,
            'cited_text'    => $citation->sourceText
        ];

        if ($citation->sourceType === CitationSourceType::Document) {
            $result['document_index'] = $citation->source;

            $result['document_title'] = $citation->sourceTitle;
        }

        if ($citation->sourceType === CitationSourceType::Url) {
            $result['url']      = $citation->source;

            $result['title']    = $citation->sourceTitle;
        }
        if ($index = data_get($citation->additionalContent, 'encrypted_index')) {
            $result['encrypted_index'] = $index;
        }

        $result = array_merge($result, $indices);

        return array_filter($result, fn ($value) => $value !== null && $value !== '');
    }

    protected static function mapSourcePositionTypeToAnthropic($sourcePositionType)
    {
        return match ($sourcePositionType) {
            CitationSourcePositionType::Page        => 'page_location',
            CitationSourcePositionType::Character   => 'char_location',
            CitationSourcePositionType::Chunk       => 'content_block_location',
            default                                 => 'web_search_result_location'
        };
    }

    protected static function mapIndicesToAnthropic($citation, $anthropicType)
    {
        $indexPropertyCommonPart = match ($anthropicType) {
            'page_location'                 => 'page_number',
            'char_location'                 => 'char_index',
            'content_block_location'        => 'block_index',
            'web_search_result_location'    => null,
            default                         => null
        };

        if ($indexPropertyCommonPart === null) {
            return [];
        }

        return array_filter([
            "start_$indexPropertyCommonPart" => $citation->sourceStartIndex,
            "end_$indexPropertyCommonPart"   => $citation->sourceEndIndex
        ], fn ($value) => $value !== null);
    }
}
