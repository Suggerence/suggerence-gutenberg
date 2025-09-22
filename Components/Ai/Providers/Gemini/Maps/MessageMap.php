<?php

namespace SuggerenceGutenberg\Components\Ai\Providers\Gemini\Maps;

use SuggerenceGutenberg\Components\Ai\Exceptions\Exception;
use SuggerenceGutenberg\Components\Ai\ValueObjects\Messages\AssistantMessage;
use SuggerenceGutenberg\Components\Ai\ValueObjects\Messages\ToolResultMessage;
use SuggerenceGutenberg\Components\Ai\ValueObjects\Messages\UserMessage;

class MessageMap
{
    protected $contents = [];

    public function __construct(
        protected $messages,
        protected $systemPrompts = []
    ) {}

    public function __invoke()
    {
        $this->contents['contents'] = [];

        foreach ($this->messages as $message) {
            $this->mapMessage($message);
        }

        foreach ($this->systemPrompts as $systemPrompt) {
            $this->mapSystemMessage($systemPrompt);
        }

        return array_filter($this->contents);
    }

    protected function mapMessage($message)
    {
        match ($message::class) {
            UserMessage::class          => $this->mapUserMessage($message),
            AssistantMessage::class     => $this->mapAssistantMessage($message),
            ToolResultMessage::class    => $this->mapToolResultMessage($message),
            default                     => throw new Exception('Could not map message type ' . $message::class)
        };
    }

    protected function mapSystemMessage($message)
    {
        if (isset($this->contents['system_instruction'])) {
            throw new Exception('Gemini only supports one system instruction.');
        }

        $this->contents['system_instruction'] = [
            'parts' => [
                ['text' => $message->content]
            ]
        ];
    }

    protected function mapToolResultMessage($message)
    {
        $parts = [];

        foreach ($message->toolResults as $toolResult) {
            $parts[] = [
                'functionResponse' => [
                    'name' => $toolResult->toolName,
                    'response' => [
                        'name'      => $toolResult->toolName,
                        'content'   => json_encode($toolResult->result)
                    ]
                ]
            ];
        }

        $this->contents['contents'][] = [
            'role'  => 'user',
            'parts' => $parts
        ];
    }

    protected function mapUserMessage($message)
    {
        $parts = [];

        if ($message->text() !== '' && $message->text() !== '0') {
            $parts[] = ['text' => $message->text()];
        }

        $parts = array_merge(
            $this->mapDocuments($message->documents()),
            $parts,
            $this->mapImages($message->images()),
            $this->mapVideo($message->media()),
            $this->mapAudio($message->media())
        );

        $this->contents['contents'][] = [
            'role'  => 'user',
            'parts' => $parts
        ];
    }

    protected function mapAssistantMessage($message)
    {
        $parts = [];

        if ($message->content !== '' && $message->content !== '0') {
            $parts[] = ['text' => $message->content];
        }

        foreach ($message->toolCalls as $toolCall) {
            $parts[] = [
                'functionCall' => [
                    'name' => $toolCall->name,
                    ...count($toolCall->arguments()) ? [
                        'args' => $toolCall->arguments()
                    ] : []
                ]
            ];
        }

        $this->contents['contents'][] = [
            'role'  => 'model',
            'parts' => $parts
        ];
    }

    protected function mapImages($images)
    {
        return array_map(fn ($image) => (new ImageMapper($image))->toPayload(), $images);
    }

    protected function mapVideo($video)
    {
        return array_map(fn ($media) => (new AudioVideoMapper($media))->toPayload(), $video);
    }

    protected function mapAudio($audio)
    {
        return array_map(fn ($media) => (new AudioVideoMapper($media))->toPayload(), $audio);
    }

    protected function mapDocuments($documents)
    {
        return array_map(fn ($document) => (new DocumentMapper($document))->toPayload(), $documents);
    }
}
