<?php

namespace SuggerenceGutenberg\Components\Ai\Providers\OpenAI\Handlers;

use Illuminate\Support\Arr;
use Illuminate\Support\Str;
use SuggerenceGutenberg\Components\Ai\Concerns\CallsTools;
use SuggerenceGutenberg\Components\Ai\Enums\ChunkType;
use SuggerenceGutenberg\Components\Ai\Enums\FinishReason;
use SuggerenceGutenberg\Components\Ai\Exceptions\ChunkDecodeException;
use SuggerenceGutenberg\Components\Ai\Exceptions\Exception;
use SuggerenceGutenberg\Components\Ai\Exceptions\RateLimitedException;
use SuggerenceGutenberg\Components\Ai\Providers\OpenAI\Concerns\BuildsTools;
use SuggerenceGutenberg\Components\Ai\Providers\OpenAI\Concerns\ProcessRateLimits;
use SuggerenceGutenberg\Components\Ai\Providers\OpenAI\Maps\FinishReasonMap;
use SuggerenceGutenberg\Components\Ai\Providers\OpenAI\Maps\MessageMap;
use SuggerenceGutenberg\Components\Ai\Providers\OpenAI\Maps\ToolChoiceMap;
use SuggerenceGutenberg\Components\Ai\Text\Chunk;
use SuggerenceGutenberg\Components\Ai\ValueObjects\Messages\AssistantMessage;
use SuggerenceGutenberg\Components\Ai\ValueObjects\Messages\ToolResultMessage;
use SuggerenceGutenberg\Components\Ai\ValueObjects\Meta;
use SuggerenceGutenberg\Components\Ai\ValueObjects\ToolCall;
use SuggerenceGutenberg\Components\Ai\ValueObjects\Usage;
use Throwable;

class Stream
{
    use BuildsTools;
    use CallsTools;
    use ProcessRateLimits;
    
    public function __construct(protected $client) {}
    
    public function handle($request)
    {
        $response = $this->sendRequest($request);

        yield from $this->processStream($response, $request);
    }

    protected function processStream($response, $request, $depth = 0)
    {
        $text = '';
        $toolCalls = [];
        $reasoningItems = [];

        while (!$response->getBody()->eof()) {
            $data = $this->parseNextDataLine($response->getBody());

            if ($data === null) {
                continue;
            }

            if ($data['type'] === 'error') {
                $this->handleErrors($data, $request);
            }

            if ($data['type'] === 'response.created') {
                yield new Chunk(
                    '',
                    [],
                    [],
                    null,
                    new Meta(
                        $data['response']['id'] ?? null,
                        $data['response']['model'] ?? null
                    ),
                    [],
                    ChunkType::Meta
                );

                continue;
            }

            if ($this->hasReasoningSummaryDelta($data)) {
                $reasoningDelta = $this->extractReasoningSummaryDelta($data);

                if ($reasoningDelta !== '') {
                    yield new Chunk(
                        $reasoningDelta,
                        [],
                        [],
                        null,
                        null,
                        [],
                        ChunkType::Thinking
                    );
                }

                continue;
            }

            if ($this->hasReasoningItems($data)) {
                $reasoningItems = $this->extractReasoningItems($data, $reasoningItems);

                continue;
            }

            if ($this->hasToolCalls($data)) {
                $toolCalls = $this->extractToolCalls($data, $toolCalls, $reasoningItems);

                continue;
            }

            $content        = $this->extractOutputTextDelta($data);

            $text           .= $content;

            $finishReason   = $this->mapFinishReason($data);

            yield new Chunk(
                $content,
                [],
                [],
                $finishReason !== FinishReason::Unknown ? $finishReason : null,
            );

            if (data_get($data, 'type') === 'response.completed') {
                yield new Chunk(
                    '',
                    [],
                    [],
                    null,
                    null,
                    [],
                    ChunkType::Meta,
                    new Usage(
                        data_get($data, 'response.usage.input_tokens'),
                        data_get($data, 'response.usage.output_tokens'),
                        null,
                        data_get($data, 'response.usage.input_tokens_details.cached_tokens'),
                        data_get($data, 'response.usage.output_tokens_details.reasoning_tokens')
                    )
                );
            }
        }

        if ($toolCalls !== []) {
            yield from $this->handleToolCalls($request, $text, $toolCalls, $depth);
        }
    }

    protected function parseNextDataLine($stream)
    {
        $line = $this->readLine($stream);

        if (!str_starts_with($line, 'data:')) {
            return null;
        }

        $line = trim(substr($line, strlen('data: ')));

        if (Str::contains($line, 'DONE')) {
            return null;
        }

        try {
            return json_decode($line, true, 512, JSON_THROW_ON_ERROR);
        } catch (Throwable $e) {
            throw new ChunkDecodeException('OpenAI', $e);
        }
    }

    protected function extractToolCalls($data, $toolCalls, $reasoningItems = [])
    {
        $type = data_get($data, 'type', '');

        if ($type === 'response.output_item.added' && data_get($data, 'item.type') === 'function_call') {
            $index = (int) data_get($data, 'output_index', count($toolCalls));

            $toolCalls[$index]['id']        = data_get($data, 'item.id');
            $toolCalls[$index]['call_id']   = data_get($data, 'item.call_id');
            $toolCalls[$index]['name']      = data_get($data, 'item.name');
            $toolCalls[$index]['arguments'] = '';

            if ($reasoningItems !== []) {
                $latestReasoning = end($reasoningItems);
                $toolCalls[$index]['reasoning_id']      = $latestReasoning['id'];
                $toolCalls[$index]['reasoning_summary'] = $latestReasoning['summary'] ?? [];
            }

            return $toolCalls;
        }

        if ($type === 'response.function_call_arguments.delta') {
            // Continue for now, only needed if we want to support streaming argument chunks
        }

        if ($type === 'response.function_call_arguments.done') {
            $callId     = data_get($data, 'item_id');
            $arguments  = data_get($data, 'arguments', '');

            foreach ($toolCalls as &$call) {
                if (($call['id'] ?? null) === $callId) {
                    if ($arguments !== '') {
                        $call['arguments'] = $arguments;
                    }

                    break;
                }
            }
        }

        return $toolCalls;
    }

    protected function handleToolCalls($request, $text, $toolCalls, $depth)
    {
        $toolCalls = $this->mapToolCalls($toolCalls);

        yield new Chunk(
            '',
            $toolCalls,
            [],
            null,
            null,
            [],
            ChunkType::ToolCall
        );

        $toolResults = $this->callTools($request->tools(), $toolCalls);

        yield new Chunk(
            '',
            [],
            $toolResults,
            null,
            null,
            [],
            ChunkType::ToolResult
        );

        $request->addMessage(new AssistantMessage($text, $toolCalls));
        $request->addMessage(new ToolResultMessage($toolResults));

        $depth++;

        if ($depth < $request->maxSteps()) {
            $nextResponse = $this->sendRequest($request);

            yield from $this->processStream($nextResponse, $request, $depth);
        }
    }

    protected function mapToolCalls($toolCalls)
    {
        return collect($toolCalls)
            ->map(fn ($toolCall) => new ToolCall(
                data_get($toolCall, 'id'),
                data_get($toolCall, 'name'),
                data_get($toolCall, 'arguments'),
                data_get($toolCall, 'call_id'),
                data_get($toolCall, 'reasoning_id'),
                data_get($toolCall, 'reasoning_summary', [])
            ))
            ->toArray();
    }

    protected function hasToolCalls($data)
    {
        $type = data_get($data, 'type', '');

        if (data_get($data, 'item.type') === 'function_call') {
            return true;
        }

        return in_array($type, [
            'response.function_call_arguments.delta',
            'response.function_call_arguments.done'
        ]);
    }

    protected function hasReasoningItems($data)
    {
        $type = data_get($data, 'type', '');
        
        return $type === 'response.output_item.done' && data_get($data, 'item.type') === 'reasoning';
    }

    protected function extractReasoningItems($data, $reasoningItems)
    {
        if (data_get($data, 'type') === 'response.output_item.done' && data_get($data, 'item.type') === 'reasoning') {
            $index = (int) data_get($data, 'output_index', count($reasoningItems));

            $reasoningItems[$index] = [
                'id'        => data_get($data, 'item.id'),
                'summary'   => data_get($data, 'item.summary', [])
            ];
        }

        return $reasoningItems;
    }

    protected function mapFinishReason($data)
    {
        $eventType      = Str::after(data_get($data, 'type'), 'response.');
        $lastOutputType = data_get($data, 'response.output.{last}.type');

        return FinishReasonMap::map($eventType, $lastOutputType);
    }

    protected function hasReasoningSummaryDelta($data)
    {
        $type = data_get($data, 'type', '');

        return $type === 'response.reasoning_summary_text.delta';
    }

    protected function extractReasoningSummaryDelta($data)
    {
        if (data_get($data, 'type') === 'response.reasoning_summary_text.delta') {
            return (string) data_get($data, 'delta', '');
        }

        return '';
    }

    protected function extractOutputTextDelta($data)
    {
        if (data_get($data, 'type') === 'response.output_text.delta') {
            return (string) data_get($data, 'delta', '');
        }

        return '';
    }

    protected function sendRequest($request)
    {
        return $this->client
            ->withOptions(['stream' => true])
            ->post(
                'responses',
                array_merge([
                    'stream'            => true,
                    'model'             => $request->model(),
                    'input'             => (new MessageMap($request->messages(), $request->systemPrompts()))(),
                    'max_output_tokens' => $request->maxTokens()
                ], Arr::whereNotNull([
                    'temperature'           => $request->temperature(),
                    'top_p'                 => $request->topP(),
                    'metadata'              => $request->providerOptions('metadata'),
                    'tools'                 => $this->buildTools($request),
                    'tool_choice'           => ToolChoiceMap::map($request->toolChoice()),
                    'previous_response_id'  => $request->providerOptions('previous_response_id'),
                    'truncation'            => $request->providerOptions('truncation'),
                    'reasoning'             => $request->providerOptions('reasoning')
                ]))
            );
    }

    protected function readLine($stream)
    {
        $buffer = '';

        while (!$stream->eof()) {
            $byte = $stream->read(1);

            if ($byte === '') {
                return $buffer;
            }

            $buffer .= $byte;

            if ($byte === "\n") {
                break;
            }
        }

        return $buffer;
    }

    protected function handleErrors($data, $request)
    {
        $code = data_get($data, 'error.code', 'unknown_error');
        if ($code === 'rate_limit_exceeded') {
            throw new RateLimitedException([]);
        }

        throw new Exception(sprintf(
            'Sending to model %s failed. Code: %s. Message: %s',
            $request->model(),
            $code,
            data_get($data, 'error.message', 'No error message provided')
        ));
    }
}
