<?php

namespace SuggerenceGutenberg\Components\Ai\Providers\Anthropic\Handlers;

use Generator;
use Throwable;
use Illuminate\Support\Arr;
use SuggerenceGutenberg\Components\Ai\Concerns\CallsTools;
use SuggerenceGutenberg\Components\Ai\Enums\ChunkType;
use SuggerenceGutenberg\Components\Ai\Exceptions\ChunkDecodeException;
use SuggerenceGutenberg\Components\Ai\Exceptions\Exception;
use SuggerenceGutenberg\Components\Ai\Exceptions\ProviderOverloadedException;
use SuggerenceGutenberg\Components\Ai\Providers\Anthropic\Concerns\ProcessesRateLimits;
use SuggerenceGutenberg\Components\Ai\Providers\Anthropic\Maps\CitationsMapper;
use SuggerenceGutenberg\Components\Ai\Providers\Anthropic\Maps\FinishReasonMap;
use SuggerenceGutenberg\Components\Ai\Providers\Anthropic\ValueObjects\StreamState;
use SuggerenceGutenberg\Components\Ai\Text\Chunk;
use SuggerenceGutenberg\Components\Ai\ValueObjects\Messages\AssistantMessage;
use SuggerenceGutenberg\Components\Ai\ValueObjects\Messages\ToolResultMessage;
use SuggerenceGutenberg\Components\Ai\ValueObjects\Meta;
use SuggerenceGutenberg\Components\Ai\ValueObjects\ToolCall;
use SuggerenceGutenberg\Components\Ai\ValueObjects\ToolResult;
use SuggerenceGutenberg\Components\Ai\ValueObjects\Usage;

class Stream
{
    use CallsTools, ProcessesRateLimits;

    protected $state;

    public function __construct(protected $client)
    {
        $this->state = new StreamState;
    }

    public function handle($request)
    {
        $response = $this->sendRequest($request);

        yield from $this->processStream($response, $request);
    }

    protected function processStream($response, $request, $depth = 0)
    {
        $this->state->reset();

        yield from $this->processStreamChunks($response, $request, $depth);
        
        if ($this->state->hasToolCalls()) {
            yield from $this->handleToolCalls($request, $this->mapToolCalls(), $depth, $this->state->buildAdditionalContent());
        }
    }

    protected function shouldContinue($request, $depth)
    {
        return $depth < $request->maxSteps();
    }

    protected function processStreamChunks($response, $request, $depth)
    {
        while (!$response->getBody()->eof()) {
            $chunk = $this->parseNextChunk($response->getBody());

            if ($chunk === null) {
                continue;
            }

            $outcome = $this->processChunk($chunk, $response, $request, $depth);

            if ($outcome instanceof Generator) {
                yield from $outcome;
            }

            if ($outcome instanceof Chunk) {
                yield $outcome;
            }
        }
    }

    protected function processChunk($chunk, $response, $request, $depth)
    {
        return match ($chunk['type'] ?? null) {
            'message_start'         => $this->handleMessageStart($response, $chunk),
            'content_block_start'   => $this->handleContentBlockStart($chunk),
            'content_block_delta'   => $this->handleContentBlockDelta($chunk),
            'content_block_stop'    => $this->handleContentBlockStop(),
            'message_delta'         => $this->handleMessageDelta($chunk, $request, $depth),
            'message_stop'          => $this->handleMessageStop($response, $request, $depth),
            'error'                 => $this->handleError($chunk),
            default                 => null
        };
    }

    protected function handleMessageStart($response, $chunk)
    {
        $this->state
            ->setModel(data_get($chunk, 'message.model', ''))
            ->setRequestId(data_get($chunk, 'message.id', ''))
            ->setUsage(data_get($chunk, 'message.usage', []));

        return new Chunk(
            '',
            null,
            new Meta(
                $this->state->requestId(),
                $this->state->model(),
                $this->processRateLimits($response)
            ),
            ChunkType::Meta
        );
    }

    protected function handleContentBlockStart($chunk)
    {
        $blockType = data_get($chunk, 'content_block.type');
        $blockIndex = (int) data_get($chunk, 'index');

        $this->state
            ->setTempContentBlockType($blockType)
            ->setTempContentBlockIndex($blockIndex);

        if ($blockType === 'tool_use') {
            $this->state->addToolCall($blockIndex, [
                'id' => data_get($chunk, 'content_block.id'),
                'name' => data_get($chunk, 'content_block.name'),
                'input' => '',
            ]);
        }

        return null;
    }

    protected function handleContentBlockDelta($chunk)
    {
        $deltaType = data_get($chunk, 'delta.type');
        $blockType = $this->state->tempContentBlockType();

        if ($blockType === 'text') {
            return $this->handleTextBlockDelta($chunk, $deltaType);
        }

        if ($blockType === 'tool_use' && $deltaType === 'input_json_delta') {
            return $this->handleToolInputDelta($chunk);
        }

        if ($blockType === 'thinking') {
            return $this->handleThinkingBlockDelta($chunk, $deltaType);
        }

        return null;
    }

    protected function handleTextBlockDelta($chunk, $deltaType)
    {
        if ($deltaType === 'text_delta') {
            $textDelta = $this->extractTextDelta($chunk);

            if ($textDelta !== '' && $textDelta !== '0') {
                $this->state->appendText($textDelta);
                $additionalContent = $this->buildCitationContent();

                return new Chunk(
                    text: $textDelta,
                    finishReason: null,
                    additionalContent: $additionalContent,
                    chunkType: ChunkType::Text
                );
            }
        }

        if ($deltaType === 'citations_delta') {
            $this->state->setTempCitation(data_get($chunk, 'delta.citation', null));
        }

        return null;
    }

    protected function buildCitationContent()
    {
        $additionalContent = [];

        if ($this->state->tempCitation() !== null) {
            $messagePartWithCitations = CitationsMapper::mapFromAnthropic([
                'type' => 'text',
                'text' => $this->state->text(),
                'citations' => [$this->state->tempCitation()],
            ]);

            $this->state->addCitation($messagePartWithCitations);

            $additionalContent['citationIndex'] = count($this->state->citations()) - 1;
        }

        return $additionalContent;
    }
    
    protected function extractTextDelta($chunk)
    {
        $textDelta = data_get($chunk, 'delta.text', '');

        if (empty($textDelta)) {
            $textDelta = data_get($chunk, 'delta.text_delta.text', '');
        }

        if (empty($textDelta)) {
            return data_get($chunk, 'text', '');
        }

        return $textDelta;
    }

    protected function handleToolInputDelta($chunk)
    {
        $jsonDelta = data_get($chunk, 'delta.partial_json', '');

        if (empty($jsonDelta)) {
            $jsonDelta = data_get($chunk, 'delta.input_json_delta.partial_json', '');
        }

        $blockIndex = $this->state->tempContentBlockIndex();

        if ($blockIndex !== null) {
            $this->state->appendToolCallInput($blockIndex, $jsonDelta);
        }

        return null;
    }

    protected function handleThinkingBlockDelta($chunk, $deltaType)
    {
        if ($deltaType === 'thinking_delta') {
            $thinkingDelta = data_get($chunk, 'delta.thinking', '');

            if (empty($thinkingDelta)) {
                $thinkingDelta = data_get($chunk, 'delta.thinking_delta.thinking', '');
            }

            $this->state->appendThinking($thinkingDelta);

            return new Chunk(
                text: $thinkingDelta,
                finishReason: null,
                chunkType: ChunkType::Thinking
            );
        }

        if ($deltaType === 'signature_delta') {
            $signatureDelta = data_get($chunk, 'delta.signature', '');

            if (empty($signatureDelta)) {
                $signatureDelta = data_get($chunk, 'delta.signature_delta.signature', '');
            }

            $this->state->appendThinkingSignature($signatureDelta);
        }

        return null;
    }

    protected function handleContentBlockStop()
    {
        $blockType = $this->state->tempContentBlockType();
        $blockIndex = $this->state->tempContentBlockIndex();

        $chunk = null;

        if ($blockType === 'tool_use' && $blockIndex !== null && isset($this->state->toolCalls()[$blockIndex])) {
            $toolCallData = $this->state->toolCalls()[$blockIndex];
            $input = data_get($toolCallData, 'input');

            if (is_string($input) && $this->isValidJson($input)) {
                $input = json_decode($input, true);
            }

            $toolCall = new ToolCall(
                id: data_get($toolCallData, 'id'),
                name: data_get($toolCallData, 'name'),
                arguments: $input
            );

            $chunk = new Chunk(
                text: '',
                toolCalls: [$toolCall],
                chunkType: ChunkType::ToolCall
            );
        }

        $this->state->resetContentBlock();

        return $chunk;
    }

    protected function handleMessageDelta($chunk, $request, $depth)
    {
        $stopReason = data_get($chunk, 'delta.stop_reason', '');

        if (! empty($stopReason)) {
            $this->state->setStopReason($stopReason);
        }

        $usage = data_get($chunk, 'usage');

        if ($usage) {
            $this->state->setUsage($usage);
        }

        if ($this->state->isToolUseFinish()) {
            return $this->handleToolUseFinish($request, $depth);
        }

        return null;
    }

    protected function handleMessageStop($response, $request, $depth)
    {
        $usage = $this->state->usage();

        return new Chunk(
            text: '',
            finishReason: FinishReasonMap::map($this->state->stopReason()),
            meta: new Meta(
                id: $this->state->requestId(),
                model: $this->state->model(),
                rateLimits: $this->processRateLimits($response)
            ),
            additionalContent: $this->state->buildAdditionalContent(),
            chunkType: ChunkType::Meta,
            usage: new Usage(
                promptTokens: $usage['input_tokens'] ?? 0,
                completionTokens: $usage['output_tokens'] ?? 0,
                cacheWriteInputTokens: $usage['cache_creation_input_tokens'] ?? 0,
                cacheReadInputTokens: $usage['cache_read_input_tokens'] ?? 0,
                thoughtTokens: $usage['cache_read_input_tokens'] ?? 0,
            )
        );
    }

    protected function handleToolUseFinish($request, $depth)
    {
        $mappedToolCalls = $this->mapToolCalls();
        $additionalContent = $this->state->buildAdditionalContent();

        yield new Chunk(
            text: '',
            toolCalls: $mappedToolCalls,
            finishReason: null,
            additionalContent: $additionalContent
        );
    }

    protected function mapToolCalls()
    {
        return array_values(array_map(function ($toolCall) {
            $input = data_get($toolCall, 'input');
            if (is_string($input) && $this->isValidJson($input)) {
                $input = json_decode($input, true);
            }

            return new ToolCall(
                id: data_get($toolCall, 'id'),
                name: data_get($toolCall, 'name'),
                arguments: $input
            );
        }, $this->state->toolCalls()));
    }

    protected function isValidJson($string)
    {
        if ($string === '' || $string === '0') {
            return false;
        }

        try {
            json_decode($string, true, 512, JSON_THROW_ON_ERROR);

            return true;
        } catch (Throwable) {
            return false;
        }
    }

    protected function parseNextChunk($stream)
    {
        $line = $this->readLine($stream);
        $line = trim($line);

        if ($line === '' || $line === '0') {
            return null;
        }

        if (str_starts_with($line, 'event:')) {
            return $this->parseEventChunk($line, $stream);
        }

        if (str_starts_with($line, 'data:')) {
            return $this->parseDataChunk($line);
        }

        return null;
    }

    protected function parseEventChunk($line, $stream)
    {
        $eventType = trim(substr($line, strlen('event:')));

        if ($eventType === 'ping') {
            return ['type' => 'ping'];
        }

        $dataLine = $this->readLine($stream);
        $dataLine = trim($dataLine);

        if ($dataLine === '' || $dataLine === '0') {
            return ['type' => $eventType];
        }

        if (! str_starts_with($dataLine, 'data:')) {
            return ['type' => $eventType];
        }

        return $this->parseJsonData($dataLine, $eventType);
    }

    protected function parseDataChunk($line)
    {
        $jsonData = trim(substr($line, strlen('data:')));

        if ($jsonData === '' || $jsonData === '0' || str_contains($jsonData, 'DONE')) {
            return null;
        }

        return $this->parseJsonData($jsonData);
    }

    protected function parseJsonData($jsonDataLine, $eventType = null)
    {
        $jsonData = trim(str_starts_with($jsonDataLine, 'data:')
            ? substr($jsonDataLine, strlen('data:'))
            : $jsonDataLine);

        if ($jsonData === '' || $jsonData === '0') {
            return $eventType ? ['type' => $eventType] : null;
        }

        try {
            $data = json_decode($jsonData, true, flags: JSON_THROW_ON_ERROR);

            if ($eventType) {
                $data['type'] = $eventType;
            }

            return $data;
        } catch (Throwable $e) {
            throw new ChunkDecodeException('Anthropic', $e);
        }
    }

    protected function handleToolCalls($request, $toolCalls, $depth, $additionalContent = null)
    {
        $toolResults = [];

        foreach ($toolCalls as $toolCall) {
            $tool = $this->resolveTool($toolCall->name, $request->tools());

            try {
                $result = call_user_func_array(
                    $tool->handle(...),
                    $toolCall->arguments()
                );

                $toolResult = new ToolResult(
                    toolCallId: $toolCall->id,
                    toolName: $toolCall->name,
                    args: $toolCall->arguments(),
                    result: $result,
                );

                $toolResults[] = $toolResult;

                yield new Chunk(
                    text: '',
                    toolResults: [$toolResult],
                    chunkType: ChunkType::ToolResult
                );
            } catch (Throwable $e) {
                if ($e instanceof Exception) {
                    throw $e;
                }

                throw Exception::toolCallFailed($toolCall, $e);
            }
        }

        $this->addMessagesToRequest($request, $toolResults, $additionalContent);

        $depth++;

        if ($this->shouldContinue($request, $depth)) {
            $nextResponse = $this->sendRequest($request);
            yield from $this->processStream($nextResponse, $request, $depth);
        }
    }

    protected function addMessagesToRequest($request, $toolResults, $additionalContent = null)
    {
        $request->addMessage(new AssistantMessage(
            $this->state->text(),
            $this->mapToolCalls(),
            $additionalContent ?? []
        ));

        $message = new ToolResultMessage($toolResults);

        $tool_result_cache_type = $request->providerOptions('tool_result_cache_type');
        if ($tool_result_cache_type) {
            $message->withProviderOptions(['cacheType' => $tool_result_cache_type]);
        }

        $request->addMessage($message);
    }

    protected function sendRequest($request)
    {
        return $this->client
            ->withOptions(['stream' => true])
            ->post('messages', Arr::whereNotNull([
                'stream' => true,
                ...Text::buildHttpRequestPayload($request),
            ]));
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

    protected function handleError($chunk)
    {
        if (data_get($chunk, 'error.type') === 'overloaded_error') {
            throw new ProviderOverloadedException('Anthropic');
        }

        throw Exception::providerResponseError(vsprintf(
            'Anthropic Error: [%s] %s',
            [
                data_get($chunk, 'error.type', 'unknown'),
                data_get($chunk, 'error.message'),
            ]
        ));
    }
}
