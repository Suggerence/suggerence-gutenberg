<?php

namespace SuggerenceGutenberg\Components\Ai\Providers\Gemini\Handlers;

use Illuminate\Support\Arr;
use SuggerenceGutenberg\Components\Ai\Concerns\CallsTools;
use SuggerenceGutenberg\Components\Ai\Enums\FinishReason;
use SuggerenceGutenberg\Components\Ai\Exceptions\Exception;
use SuggerenceGutenberg\Components\Ai\Providers\Gemini\Concerns\ValidatesResponse;
use SuggerenceGutenberg\Components\Ai\Providers\Gemini\Maps\CitationMapper;
use SuggerenceGutenberg\Components\Ai\Providers\Gemini\Maps\FinishReasonMap;
use SuggerenceGutenberg\Components\Ai\Providers\Gemini\Maps\MessageMap;
use SuggerenceGutenberg\Components\Ai\Providers\Gemini\Maps\ToolCallMap;
use SuggerenceGutenberg\Components\Ai\Providers\Gemini\Maps\ToolChoiceMap;
use SuggerenceGutenberg\Components\Ai\Providers\Gemini\Maps\ToolMap;
use SuggerenceGutenberg\Components\Ai\Text\ResponseBuilder;
use SuggerenceGutenberg\Components\Ai\Text\Step;
use SuggerenceGutenberg\Components\Ai\ValueObjects\Messages\AssistantMessage;
use SuggerenceGutenberg\Components\Ai\ValueObjects\Messages\ToolResultMessage;
use SuggerenceGutenberg\Components\Ai\ValueObjects\Meta;
use SuggerenceGutenberg\Components\Ai\ValueObjects\Usage;

class Text
{
    use CallsTools, ValidatesResponse;

    protected $responseBuilder;

    public function __construct(protected $client, protected $apiKey)
    {
        $this->responseBuilder = new ResponseBuilder;
    }

    public function handle($request)
    {
        $response = $this->sendRequest($request);

        $this->validateResponse($response);

        $data = $response->json();

        $isToolCall = !empty(data_get($data, 'candidates.0.content.parts.0.functionCall'));

        $responseMessage = new AssistantMessage(
            data_get($data, 'candidates.0.content.parts.0.text') ?? '',
            $isToolCall ? ToolCallMap::map(data_get($data, 'candidates.0.content.parts', [])) : [],
        );

        $request->addMessage($responseMessage);

        $finishReason = FinishReasonMap::map(
            data_get($data, 'candidates.0.finishReason'),
            $isToolCall
        );

        return match ($finishReason) {
            FinishReason::ToolCalls                     => $this->handleToolCalls($data, $request),
            FinishReason::Stop, FinishReason::Length    => $this->handleStop($data, $request, $finishReason),
            default                                     => throw new Exception('Gemini: unhandled finish reason')
        };
    }

    protected function sendRequest($request)
    {
        $providerOptions = $request->providerOptions();

        $thinkingConfig = Arr::whereNotNull([
            'thinkingBudget' => $providerOptions['thinkingBudget'] ?? null
        ]);

        $generationConfig = Arr::whereNotNull([
            'temperature'       => $request->temperature(),
            'topP'              => $request->topP(),
            'maxOutputTokens'   => $request->maxTokens(),
            'thinkingConfig'    => $thinkingConfig !== [] ? $thinkingConfig : null
        ]);

        if ($request->tools() !== [] && $request->providerTools() != []) {
            throw new Exception('Use of provider tools with custom tools is not currently supported by Gemini.');
        }

        $tools = [];

        if ($request->providerTools() !== []) {
            $tools = [
                Arr::mapWithKeys(
                    $request->providerTools(),
                    fn ($providerTool) => [$providerTool->type => (object) []]
                )
            ];
        }

        if ($request->tools !== []) {
            $tools['function_declarations'] = ToolMap::map($request->tools());
        }

        return $this->client->post(
            "models/{$request->model()}:generateContent",
            Arr::whereNotNull([
                ...(new MessageMap($request->messages(), $request->systemPrompts()))(),
                'cachedContent'     => $providerOptions['cachedContentName'] ?? null,
                'generationConfig'  => $generationConfig !== [] ? $generationConfig : null,
                'tools'             => $tools !== [] ? $tools : null,
                'tool_config'       => $request->toolChoice() ? ToolChoiceMap::map($request->toolChoice()) : null,
                'safetySettings'    => $providerOptions['safetySettings'] ?? null
            ])
        );
    }

    protected function handleStop($data, $request, $finishReason)
    {
        $this->addStep($data, $request, $finishReason);

        return $this->responseBuilder->toResponse();
    }

    protected function handleToolCalls($data, $request)
    {
        $toolResults = $this->callTools(
            $request->tools(),
            ToolCallMap::map(data_get($data, 'candidates.0.content.parts', []))
        );

        $request->addMessage(new ToolResultMessage($toolResults));

        $this->addStep($data, $request, FinishReason::ToolCalls, $toolResults);

        if ($this->shouldContinue($request)) {
            return $this->handle($request);
        }

        return $this->responseBuilder->toResponse();
    }

    protected function shouldContinue($request)
    {
        return $this->responseBuilder->steps->count() < $request->maxSteps();
    }

    protected function addStep($data, $request, $finishReason, $toolResults = [])
    {
        $providerOptions = $request->providerOptions();

        $this->responseBuilder->addStep(new Step(
            data_get($data, 'candidates.0.content.parts.0.text') ?? '',
            $finishReason,
            $finishReason === FinishReason::ToolCalls ? ToolCallMap::map(data_get($data, 'candidates.0.content.parts', [])) : [],
            $toolResults,
            new Usage(
                isset($providerOptions['cachedContentName'])
                    ? (data_get($data, 'usageMetadata.promptTokenCount', 0) - data_get($data, 'usageMetadata.cachedContentTokenCount', 0))
                    : data_get($data, 'usageMetadata.promptTokenCount', 0),
                data_get($data, 'usageMetadata.candidatesTokenCount', 0),
                null,
                data_get($data, 'usageMetadata.cachedContentTokenCount', null),
                data_get($data, 'usageMetadata.thoughtsTokenCount', null)
            ),
            new Meta(
                data_get($data, 'id', ''),
                data_get($data, 'modelVersion')
            ),
            $request->messages(),
            $request->systemPrompts(),
            Arr::whereNotNull([
                'citations'         => CitationMapper::mapFromGemini(data_get($data, 'candidates.0', [])) ?: null,
                'searchEntryPoint'  => data_get($data, 'candidates.0.groundingMetadata.searchEntryPoint', null),
                'searchQueries'     => data_get($data, 'candidates.0.groundingMetadata.webSearchQueries', null),
            ])
        ));
    }
}
