<?php

namespace SuggerenceGutenberg\Components\Ai\Providers\OpenAI\Maps;

use SuggerenceGutenberg\Components\Ai\Exceptions\Exception;
use SuggerenceGutenberg\Components\Ai\ValueObjects\Messages\UserMessage;
use SuggerenceGutenberg\Components\Ai\ValueObjects\Messages\AssistantMessage;
use SuggerenceGutenberg\Components\Ai\ValueObjects\Messages\SystemMessage;
use SuggerenceGutenberg\Components\Ai\ValueObjects\Messages\ToolResultMessage;
use SuggerenceGutenberg\Components\Ai\Helpers\Functions;

class MessageMap
{
    protected $mappedMessages = [];

    public function __construct(
        protected $messages,
        protected $systemPrompts
    )
    {
        $this->messages = array_merge(
            $this->systemPrompts,
            $this->messages
        );
    }

    public function __invoke()
    {
        array_map(fn ($message) => $this->mapMessage($message), $this->messages);

        return $this->mappedMessages;
    }

    protected function mapMessage($message)
    {
        match ($message::class) {
            UserMessage::class          => $this->mapUserMessage($message),
            AssistantMessage::class     => $this->mapAssistantMessage($message),
            ToolResultMessage::class    => $this->mapToolResultMessage($message),
            SystemMessage::class        => $this->mapSystemMessage($message),
            default                     => throw new Exception('Could not map message type ' . $message::class)
        };
    }

    protected function mapSystemMessage($message)
    {
        $this->mappedMessages[] = [
            'role'      => 'system',
            'content'   => $message->content
        ];
    }

    protected function mapToolResultMessage($message)
    {
        foreach ($message->toolResults as $toolResult)
        {
            $output = $toolResult->result;
            if (!is_string($output)) {
                $output = is_array($output) ? json_encode(
                    $output,
                    JSON_THROW_ON_ERROR
                ) : strval($output);
            }

            $this->mappedMessages[] = [
                'type'      => 'function_call_output',
                'call_id'   => $toolResult->toolCallResultId,
                'output'    => $output
            ];
        }
    }

    protected function mapUserMessage($message)
    {
        $this->mappedMessages[] = [
            'role'      => 'user',
            'content'   => [
                ['type' => 'input_text', 'text' => $message->text()],
                ...self::mapImageParts($message->images()),
                ...self::mapDocumentParts($message->documents())
            ],
            ...$message->additionalAttributes
        ];
    }

    protected static function mapImageParts($images)
    {
        return array_map(fn ($image) => (new ImageMapper($image))->toPayload(), $images);
    }

    protected static function mapDocumentParts($documents)
    {
        return array_map(fn ($document) => (new DocumentMapper($document))->toPayload(), $documents);
    }

    protected function mapAssistantMessage($message)
    {
        if ($message->content !== '' && $message->content !== '0') {
            $mappedMessage = [
                'role'      => 'assistant',
                'content'   => [
                    ['type' => 'output_text', 'text' => $message->content],
                ]
            ];

            if (isset($message->additionalContent['citations'])) {
                $mappedMessage['content'][0]['annotations'] = CitationsMapper::mapToOpenAI($message->additionalContent['citations'][0])['annotations'];
            }

            $this->mappedMessages[] = $mappedMessage;
        }

        if ($message->toolCalls !== []) {
            $reasoningBlocks = Functions::collect($message->toolCalls)
                ->whereNotNull('reasoningId')
                ->unique('reasoningId')
                ->map(fn ($toolCall) => [
                    'type'      => 'reasoning',
                    'id'        => $toolCall->reasoningId,
                    'summary'   => $toolCall->reasoningSummary
                ])
                ->values()
                ->all();

            array_push(
                $this->mappedMessages,
                ...$reasoningBlocks,
                ...array_map(fn ($toolCall) => [
                    'id'        => $toolCall->id,
                    'call_id'   => $toolCall->resultId,
                    'type'      => 'function_call',
                    'name'      => $toolCall->name,
                    'arguments' => json_encode($toolCall->arguments())
                ], $message->toolCalls)
            );
        }
    }
}
