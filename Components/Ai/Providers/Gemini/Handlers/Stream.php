<?php

namespace SuggerenceGutenberg\Components\Ai\Providers\Gemini\Handlers;

use SuggerenceGutenberg\Components\Ai\Helpers\Str;
use SuggerenceGutenberg\Components\Ai\Concerns\CallsTools;
use SuggerenceGutenberg\Components\Ai\Enums\ChunkType;
use SuggerenceGutenberg\Components\Ai\Enums\FinishReason;
use SuggerenceGutenberg\Components\Ai\Exceptions\ChunkDecodeException;
use SuggerenceGutenberg\Components\Ai\Exceptions\Exception;
use SuggerenceGutenberg\Components\Ai\Providers\Anthropic\Maps\ToolMap;
use SuggerenceGutenberg\Components\Ai\Providers\Gemini\Maps\FinishReasonMap;
use SuggerenceGutenberg\Components\Ai\Providers\Gemini\Maps\MessageMap;
use SuggerenceGutenberg\Components\Ai\Providers\Gemini\Maps\ToolChoiceMap;
use SuggerenceGutenberg\Components\Ai\Text\Chunk;
use SuggerenceGutenberg\Components\Ai\ValueObjects\Messages\AssistantMessage;
use SuggerenceGutenberg\Components\Ai\ValueObjects\Messages\ToolResultMessage;
use SuggerenceGutenberg\Components\Ai\ValueObjects\Meta;
use SuggerenceGutenberg\Components\Ai\ValueObjects\ToolCall;
use SuggerenceGutenberg\Components\Ai\ValueObjects\Usage;
use SuggerenceGutenberg\Components\Ai\Helpers\Functions;

use Throwable;

class Stream
{
    use CallsTools;

    public function __construct(
        protected $client,
        protected $apiKey
    ) {}
    
    public function handle($request)
    {
        $response = $this->sendRequest($request);

        yield from $this->processStream($response, $request);
    }

    protected function processStream($response, $request, $depth = 0)
    {
        if ($depth >= $request->maxSteps()) {
            throw new Exception('Maximum tool call chain depth exceeded');
        }

        $text = '';
        $toolCalls = [];

        while (!$response->body()->eof()) {
            $data = $this->parseNextDataLine($response->body());

            if ($data === null) {
                continue;
            }

            if ($this->hasToolCalls($data)) {
                $toolCalls = $this->extractToolCalls($data, $toolCalls);

                if ($this->mapFinishReason($data) === FinishReason::ToolCalls) {
                    yield from $this->handleToolCalls($request, $text, $toolCalls, $depth, $data);
                }

                continue;
            }

            $content = Functions::data_get($data, 'candidates.0.content.parts.0.text') ?? '';
            $text .= $content;

            $finishReason = $this->mapFinishReason($data);

            yield new Chunk(
                $content,
                [],
                [],
                $finishReason !== FinishReason::Unknown ? $finishReason : null,
                new Meta(
                    Functions::data_get($data, 'responseId'),
                    Functions::data_get($data, 'modelVersion')
                ),
                [],
                ChunkType::Text,
                $this->extractUsage($data, $request)
            );
        }
    }

    protected function parseNextDataLine($stream)
    {
        $line = $this->readLine($stream);

        if (!str_starts_with($line, 'data:')) {
            return null;
        }

        $line = trim(substr($line, strlen('data: ')));

        if ($line === '' || $line === '[DONE]') {
            return null;
        }

        try {
            return json_decode($line, true, 512, JSON_THROW_ON_ERROR);
        } catch (Throwable $e) {
            throw new ChunkDecodeException('Gemini', $e);
        }
    }

    public function extractToolCalls($data, $toolCalls)
    {
        $parts = Functions::data_get($data, 'candidates.0.content.parts', []);

        foreach ($parts as $index => $part) {
            if (isset($part['functionCall'])) {
                $toolCalls[$index]['name']      = Functions::data_get($part, 'functionCall.name');
                $toolCalls[$index]['arguments'] = Functions::data_get($part, 'functionCall.args', '');
            }
        }

        return $toolCalls;
    }

    public function handleToolCalls($request, $text, $toolCalls, $depth, $data)
    {
        $toolCalls = $this->mapToolCalls($toolCalls);

        yield new Chunk(
            '',
            $toolCalls,
            [],
            null,
            new Meta(
                Functions::data_get($data, 'responseId'),
                Functions::data_get($data, 'modelVersion')
            ),
            [],
            ChunkType::ToolCall,
            $this->extractUsage($data, $request)
        );

        $toolResults = $this->callTools($request->tools(), $toolCalls);

        yield new Chunk(
            '',
            [],
            $toolResults,
            null,
            new Meta(
                Functions::data_get($data, 'responseId'),
                Functions::data_get($data, 'modelVersion')
            ),
            [],
            ChunkType::ToolResult,
            $this->extractUsage($data, $request)
        );

        $request->addMessage(new AssistantMessage($text, $toolCalls));
        $request->addMessage(new ToolResultMessage($toolResults));

        $nextResponse = $this->sendRequest($request);
        yield from $this->processStream($nextResponse, $request, $depth + 1);
    }

    protected function mapToolCalls($toolCalls)
    {
        return Functions::collect($toolCalls)
            ->map(fn ($toolCall) => new ToolCall(
                empty($toolCall['id']) ? 'gm-' . Str::random(20) : $toolCall['id'],
                Functions::data_get($toolCall, 'name'),
                Functions::data_get($toolCall, 'arguments')
            ))
            ->toArray();
    }

    protected function hasToolCalls($data)
    {
        $parts = Functions::data_get($data, 'candidates.0.content.parts', []);

        foreach ($parts as $part) {
            if (isset($part['functionCall'])) {
                return true;
            }
        }

        return false;
    }

    protected function extractUsage($data, $request)
    {
        $providerOptions = $request->providerOptions();

        return new Usage(
            isset($providerOptions['cachedContentName'])
                ? (Functions::data_get($data, 'usageMetadata.promptTokenCount', 0) - Functions::data_get($data, 'usageMetadata.cachedContentTokenCount', 0))
                : Functions::data_get($data, 'usageMetadata.promptTokenCount', 0),
            Functions::data_get($data, 'usageMetadata.candidatesTokenCount', 0),
            null,
            Functions::data_get($data, 'usageMetadata.cachedContentTokenCount', null),
            Functions::data_get($data, 'usageMetadata.thoughtsTokenCount', null)
        );
    }

    protected function mapFinishReason($data)
    {
        $finishReason = Functions::data_get($data, 'candidates.0.finishReason');

        if (!$finishReason) {
            return FinishReason::Unknown;
        }

        $isToolCall = $this->hasToolCalls($data);

        return FinishReasonMap::map($finishReason, $isToolCall);
    }

    protected function sendRequest($request)
    {
        $providerOptions = $request->providerOptions();

        if ($request->tools() !== [] && ($providerOptions['searchGrounding'] ?? false)) {
            throw new Exception('Use of search grounding with custom tools is not currently supported.');
        }

        $tools = match (true) {
            $providerOptions['searchGrounding'] ?? false    => [['google_search'] => (object) []],
            $request->tools() !== []                        => ['function_declarations' => ToolMap::map($request->tools())],
            default                                         => []
        };

        return $this->client
            ->withOptions(['stream' => true])
            ->post(
                "models/{$request->model()}:streamGenerateContent?alt=sse",
                Functions::where_not_null([
                    ...(new MessageMap($request->messages(), $request->systemPrompts()))(),
                    'cachedContent'     => $providerOptions['cachedContentName'] ?? null,
                    'generationConfig'  => Functions::where_not_null([
                        'temperature'       => $request->temperature(),
                        'topP'              => $request->topP(),
                        'maxOutputTokens'   => $request->maxTokens(),
                        'thinkingConfig'    => Functions::where_not_null([
                            'thinkingBudget'      => $providerOptions['thinkingBudget'] ?? null
                        ]) ?: null
                    ]),
                    'tools'             => $tools !== [] ? $tools : null,
                    'tool_config'       => $request->toolChoice() ? ToolChoiceMap::map($request->toolChoice()) : null,
                    'safetySettings'    => $providerOptions['safetySettings'] ?? null,
                ])
            );
    }

    protected function readLine($stream)
    {
        $buffer = '';

        while (! $stream->eof()) {
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
}
