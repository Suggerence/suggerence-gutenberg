<?php

namespace SuggerenceGutenberg\Components\Ai\Providers\Anthropic\Maps;

use BackedEnum;
use SuggerenceGutenberg\Components\Ai\Exceptions\Exception;
use SuggerenceGutenberg\Components\Ai\ValueObjects\Messages\AssistantMessage;
use SuggerenceGutenberg\Components\Ai\ValueObjects\Messages\SystemMessage;
use SuggerenceGutenberg\Components\Ai\ValueObjects\Messages\ToolResultMessage;
use SuggerenceGutenberg\Components\Ai\ValueObjects\Messages\UserMessage;

class MessageMap
{
    public static function map($messages, $requestProviderOptions = [])
    {
        if (array_filter($messages, fn ($message) => $message instanceof SystemMessage) !== []) {
            throw new Exception('Anthropic does not support SystemMessages in the messages array. Use withSystemPrompt or withSystemPrompts instead.');
        }

        return array_map(
            fn ($message) => self::mapMessage($message, $requestProviderOptions),
            $messages
        );
    }

    public static function mapSystemMessages($messages)
    {
        return array_map(
            fn($message) => self::mapSystemMessage($message),
            $messages
        );
    }

    protected static function mapMessage($message, $requestProviderOptions = [])
    {
        return match ($message::class) {
            UserMessage::class          => self::mapUserMessage($message, $requestProviderOptions),
            AssistantMessage::class     => self::mapAssistantMessage($message),
            ToolResultMessage::class    => self::mapToolResultMessage($message),
            default                     => throw new Exception('Could not map message type ' . $message::class),
        };
    }

    protected static function mapSystemMessage($systemMessage)
    {
        $cacheType = $systemMessage->providerOptions('cacheType');

        return array_filter([
            'type'          => 'text',
            'text'          => $systemMessage->content,
            'cache_control' => $cacheType ? ['type' => $cacheType instanceof BackedEnum ? $cacheType->value : $cacheType] : null,
        ]);
    }

    protected static function mapToolResultMessage($message)
    {
        $cacheType      = $message->providerOptions('cacheType');
        $cacheControl   = $cacheType ? ['type' => $cacheType instanceof BackedEnum ? $cacheType->value : $cacheType] : null;

        $toolResults    = $message->toolResults;
        $totalResults   = count($toolResults);

        return [
            'role'      => 'user',
            'content'   => array_map(function ($toolResult, $index) use ($cacheControl, $totalResults) {
                $isLastResult = $index === $totalResults - 1;

                return array_filter([
                    'type'          => 'tool_result',
                    'tool_use_id'   => $toolResult->toolCallId,
                    'content'       => $toolResult->result,
                    'cache_control' => $isLastResult ? $cacheControl : null,
                ]);
            }, $toolResults, array_keys($toolResults)),
        ];
    }

    protected static function mapUserMessage($message, $requestProviderOptions = [])
    {
        $cacheType = $message->providerOptions('cacheType');
        $cacheControl = $cacheType ? ['type' => $cacheType instanceof BackedEnum ? $cacheType->value : $cacheType] : null;

        return [
            'role'      => 'user',
            'content'   => [
                array_filter([
                    'type' => 'text',
                    'text' => $message->text(),
                    'cache_control' => $cacheControl,
                ]),
                ...self::mapImageParts($message->images(), $cacheControl),
                ...self::mapDocumentParts($message->documents(), $cacheControl, $requestProviderOptions),
            ],
        ];
    }

    protected static function mapAssistantMessage($message)
    {
        $cacheType = $message->providerOptions('cacheType');

        $content = [];

        if (isset($message->additionalContent['thinking']) && isset($message->additionalContent['thinking_signature'])) {
            $content[] = [
                'type'      => 'thinking',
                'thinking'  => $message->additionalContent['thinking'],
                'signature' => $message->additionalContent['thinking_signature'],
            ];
        }

        if (isset($message->additionalContent['citations'])) {
            foreach ($message->additionalContent['citations'] as $part) {
                $content[] = array_filter([
                    ...CitationsMapper::mapToAnthropic($part),
                    'cache_control' => $cacheType ? ['type' => $cacheType instanceof BackedEnum ? $cacheType->value : $cacheType] : null,
                ]);
            }
        } elseif ($message->content !== '' && $message->content !== '0') {

            $content[] = array_filter([
                'type'          => 'text',
                'text'          => $message->content,
                'cache_control' => $cacheType ? ['type' => $cacheType instanceof BackedEnum ? $cacheType->value : $cacheType] : null,
            ]);
        }

        $toolCalls = $message->toolCalls
            ? array_map(fn($toolCall) => [
                'type'  => 'tool_use',
                'id'    => $toolCall->id,
                'name'  => $toolCall->name,
                'input' => $toolCall->arguments(),
            ], $message->toolCalls)
            : [];

        return [
            'role'      => 'assistant',
            'content'   => array_merge($content, $toolCalls),
        ];
    }

    protected static function mapImageParts($parts, $cacheControl = null)
    {
        return array_map(
            fn($image) => (new ImageMapper($image, $cacheControl))->toPayload(),
            $parts
        );
    }

    protected static function mapDocumentParts($parts, $cacheControl = null, $requestProviderOptions = [])
    {
        return array_map(
            fn($document) => (new DocumentMapper($document, $cacheControl, $requestProviderOptions))->toPayload(),
            $parts
        );
    }
}
