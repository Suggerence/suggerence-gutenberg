<?php

namespace SuggerenceGutenberg\Components\Ai\Providers\Anthropic\Handlers;

use InvalidArgumentException;
use Illuminate\Support\Arr;
use Illuminate\Support\Collection;
use SuggerenceGutenberg\Components\Ai\Providers\Anthropic\Concerns\ExtractsCitations;
use SuggerenceGutenberg\Components\Ai\Providers\Anthropic\Concerns\ExtractsText;
use SuggerenceGutenberg\Components\Ai\Providers\Anthropic\Concerns\ExtractsThinking;
use SuggerenceGutenberg\Components\Ai\Providers\Anthropic\Concerns\HandlesHttpRequests;
use SuggerenceGutenberg\Components\Ai\Providers\Anthropic\Concerns\ProcessesRateLimits;
use SuggerenceGutenberg\Components\Ai\Providers\Anthropic\Handlers\StructuredStrategies\JsonModeStructuredStrategy;
use SuggerenceGutenberg\Components\Ai\Providers\Anthropic\Handlers\StructuredStrategies\ToolStructuredStrategy;
use SuggerenceGutenberg\Components\Ai\Providers\Anthropic\Maps\FinishReasonMap;
use SuggerenceGutenberg\Components\Ai\Providers\Anthropic\Maps\MessageMap;
use SuggerenceGutenberg\Components\Ai\Structured\Response;
use SuggerenceGutenberg\Components\Ai\Structured\ResponseBuilder;
use SuggerenceGutenberg\Components\Ai\Structured\Step;
use SuggerenceGutenberg\Components\Ai\Structured\Request as StructuredRequest;
use SuggerenceGutenberg\Components\Ai\ValueObjects\Messages\AssistantMessage;
use SuggerenceGutenberg\Components\Ai\ValueObjects\Meta;
use SuggerenceGutenberg\Components\Ai\ValueObjects\Usage;

class Structured
{
    use ExtractsCitations, ExtractsText, ExtractsThinking, HandlesHttpRequests, ProcessesRateLimits;

    protected $tempResponse;

    protected $responseBuilder;

    protected $strategy;

    protected $httpResponse;

    public function __construct(protected $client, protected $request)
    {
        $this->responseBuilder = new ResponseBuilder;

        $this->strategy = $this->request->providerOptions('use_tool_calling') === true
            ? new ToolStructuredStrategy($request)
            : new JsonModeStructuredStrategy($request);
    }

    public function handle()
    {
        $this->strategy->appendMessages();

        $this->sendRequest();

        $this->prepareTempResponse();

        $responseMessage = new AssistantMessage(
            $this->tempResponse->text,
            $this->tempResponse->additionalContent
        );

        $this->request->addMessage($responseMessage);

        $this->responseBuilder->addStep(new Step(
            $this->tempResponse->text,
            $this->tempResponse->finishReason,
            $this->tempResponse->usage,
            $this->tempResponse->meta,
            $this->request->messages(),
            $this->request->systemPrompts(),
            $this->tempResponse->additionalContent,
            $this->tempResponse->structured ?? []
        ));

        return $this->responseBuilder->toResponse();
    }

    #[\Override]
    public static function buildHttpRequestPayload($request)
    {
        if (!$request->is(StructuredRequest::class)) {
            throw new InvalidArgumentException('Request must be an instance of ' . StructuredRequest::class);
        }

        $structuredStrategy = $request->providerOptions('use_tool_calling') === true
            ? new ToolStructuredStrategy(request: $request)
            : new JsonModeStructuredStrategy(request: $request);

        $basePayload = Arr::whereNotNull([
            'model' => $request->model(),
            'messages' => MessageMap::map($request->messages(), $request->providerOptions()),
            'system' => MessageMap::mapSystemMessages($request->systemPrompts()) ?: null,
            'thinking' => $request->providerOptions('thinking.enabled') === true
                ? [
                    'type' => 'enabled',
                    'budget_tokens' => is_int($request->providerOptions('thinking.budgetTokens'))
                        ? $request->providerOptions('thinking.budgetTokens')
                        : 1024,
                ]
                : null,
            'max_tokens' => $request->maxTokens(),
            'temperature' => $request->temperature(),
            'top_p' => $request->topP(),
            'mcp_servers' => $request->providerOptions('mcp_servers'),
        ]);

        return $structuredStrategy->mutatePayload($basePayload);
    }

    protected function prepareTempResponse()
    {
        $data = $this->httpResponse->json();

        $baseResponse = new Response(
            steps: new Collection,
            text: $this->extractText($data),
            structured: [],
            finishReason: FinishReasonMap::map(data_get($data, 'stop_reason', '')),
            usage: new Usage(
                promptTokens: data_get($data, 'usage.input_tokens'),
                completionTokens: data_get($data, 'usage.output_tokens'),
                cacheWriteInputTokens: data_get($data, 'usage.cache_creation_input_tokens', null),
                cacheReadInputTokens: data_get($data, 'usage.cache_read_input_tokens', null)
            ),
            meta: new Meta(
                id: data_get($data, 'id'),
                model: data_get($data, 'model'),
                rateLimits: $this->processRateLimits($this->httpResponse)
            ),
            additionalContent: Arr::whereNotNull([
                'citations' => $this->extractCitations($data),
                ...$this->extractThinking($data),
            ])
        );

        $this->tempResponse = $this->strategy->mutateResponse($this->httpResponse, $baseResponse);
    }
}
