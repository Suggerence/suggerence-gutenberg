<?php

namespace SuggerenceGutenberg\Components\Ai\Providers\Suggerence\Handlers;

use SuggerenceGutenberg\Components\Ai\Helpers\Collection;
use SuggerenceGutenberg\Components\Ai\Concerns\CallsTools;
use SuggerenceGutenberg\Components\Ai\Enums\FinishReason;
use SuggerenceGutenberg\Components\Ai\Exceptions\Exception;
use SuggerenceGutenberg\Components\Ai\Providers\Anthropic\Concerns\ExtractsCitations;
use SuggerenceGutenberg\Components\Ai\Providers\Anthropic\Concerns\ExtractsText;
use SuggerenceGutenberg\Components\Ai\Providers\Anthropic\Concerns\ExtractsThinking;
use SuggerenceGutenberg\Components\Ai\Providers\Anthropic\Concerns\ProcessesRateLimits;
use SuggerenceGutenberg\Components\Ai\Providers\Suggerence\Maps\FinishReasonMap;
use SuggerenceGutenberg\Components\Ai\Providers\Anthropic\Maps\MessageMap;
use SuggerenceGutenberg\Components\Ai\Providers\Anthropic\Maps\ToolChoiceMap;
use SuggerenceGutenberg\Components\Ai\Providers\Anthropic\Maps\ToolMap;
use SuggerenceGutenberg\Components\Ai\Text\Request as TextRequest;
use SuggerenceGutenberg\Components\Ai\Text\Response;
use SuggerenceGutenberg\Components\Ai\Text\ResponseBuilder;
use SuggerenceGutenberg\Components\Ai\Text\Step;
use SuggerenceGutenberg\Components\Ai\ValueObjects\Messages\AssistantMessage;
use SuggerenceGutenberg\Components\Ai\ValueObjects\Messages\ToolResultMessage;
use SuggerenceGutenberg\Components\Ai\ValueObjects\Meta;
use SuggerenceGutenberg\Components\Ai\ValueObjects\ToolCall;
use SuggerenceGutenberg\Components\Ai\ValueObjects\Usage;
use SuggerenceGutenberg\Components\Ai\Helpers\Functions;

use InvalidArgumentException;

class Text
{
    use CallsTools, ExtractsCitations, ExtractsText, ExtractsThinking, ProcessesRateLimits;

    protected $tempResponse;

    protected $responseBuilder;

    protected $httpResponse;

    public function __construct(protected $client, protected $request)
    {
        $this->responseBuilder = new ResponseBuilder;
    }

    public function handle()
    {
        $this->sendRequest();

        $this->prepareTempResponse();

        $responseMessage = new AssistantMessage(
            $this->tempResponse->text,
            $this->tempResponse->toolCalls,
            $this->tempResponse->additionalContent
        );

        $this->request->addMessage($responseMessage);

        return match ($this->tempResponse->finishReason) {
            FinishReason::ToolCalls                     => $this->handleToolCalls(),
            FinishReason::Stop, FinishReason::Length    => $this->handleStop(),
            default                                     => throw new Exception('Suggerence: unknown finish reason')
        };
    }

    public static function buildHttpRequestPayload($request)
    {
        if (!$request->is(TextRequest::class)) {
            throw new InvalidArgumentException('Request must be an instance of ' . TextRequest::class);
        }

        return Functions::where_not_null([
            'model'         => $request->model(),
            'system'        => MessageMap::mapSystemMessages($request->systemPrompts()) ?: null,
            'messages'      => MessageMap::map($request->messages(), $request->providerOptions()),
            'thinking'      => $request->providerOptions('thinking.enabled') === true ? [
                'type'          => 'enabled',
                'budget_tokens' => is_int($request->providerOptions('thinking.budgetTokens')) ? $request->providerOptions('thinking.budgetTokens') : 1024
            ] : null,
            'max_tokens'    => $request->maxTokens(),
            'temperature'   => $request->temperature(),
            'top_p'         => $request->topP(),
            'tools'         => static::buildTools($request) ?: null,
            'tool_choice'   => ToolChoiceMap::map($request->toolChoice()),
            'mcp_servers'   => $request->providerOptions('mcp_servers')
        ]);
    }

    protected function handleToolCalls()
    {
        $toolResults    = $this->callTools($this->request->tools(), $this->tempResponse->toolCalls);
        $message        = new ToolResultMessage($toolResults);

        if ($toolResultCacheType = $this->request->providerOptions('tool_result_cache_type')) {
            $message->withProviderOptions(['cacheType' => $toolResultCacheType]);
        }

        $this->request->addMessage($message);

        $this->addStep($toolResults);

        if ($this->responseBuilder->steps->count() < $this->request->maxSteps()) {
            return $this->handle();
        }

        return $this->responseBuilder->toResponse();
    }

    public function handleStop()
    {
        $this->addStep();

        return $this->responseBuilder->toResponse();
    }

    protected function addStep($toolResults = [])
    {
        $this->responseBuilder->addStep(new Step(
            $this->tempResponse->text,
            $this->tempResponse->finishReason,
            $this->tempResponse->toolCalls,
            $toolResults,
            $this->tempResponse->usage,
            $this->tempResponse->meta,
            $this->request->messages(),
            $this->request->systemPrompts(),
            $this->tempResponse->additionalContent
        ));
    }

    protected function prepareTempResponse()
    {
        $data = $this->httpResponse->json();
        $data = Functions::data_get($data, 'steps.0');

        // error_log("Response: " . print_r($data, true));

        $this->tempResponse = new Response(
            new Collection,
            $this->extractText($data),
            FinishReasonMap::map(Functions::data_get($data, 'finishReason', '')),
            $this->extractToolCalls($data),
            [],
            new Usage(
                Functions::data_get($data, 'usage.inputTokens'),
                Functions::data_get($data, 'usage.outputTokens')
            ),
            new Meta(
                Functions::data_get($data, 'response.id'),
                Functions::data_get($data, 'response.modelId'),
                $this->processRateLimits($this->httpResponse)
            ),
            new Collection,
            Functions::where_not_null([
                'citations' => $this->extractCitations($data),
                ...$this->extractThinking($data)
            ])
        );
    }

    protected static function buildTools($request)
    {
        $tools = ToolMap::map($request->tools());

        if ($request->providerTools() === []) {
            return $tools;
        }

        $providerTools = array_map(
            fn ($tool) => [
                'type' => $tool->type,
                'name' => $tool->name
            ],
            $request->providerTools()
        );

        return array_merge($providerTools, $tools);
    }

    protected function extractToolCalls($data)
    {
        $toolCalls = [];
        $contents = Functions::data_get($data, 'content', []);

        foreach ($contents as $content) {
            if (Functions::data_get($content, 'type') === 'tool-call') {
                $toolCalls[] = new ToolCall(
                    Functions::data_get($content, 'toolCallId'),
                    Functions::data_get($content, 'toolName'),
                    Functions::data_get($content, 'input')
                );
            }
        }

        return $toolCalls;
    }

    protected function sendRequest()
    {
        $this->httpResponse = $this->client->post('gutenberg/chat', static::buildHttpRequestPayload($this->request));

        $this->handleResponseErrors();
    }

    protected function handleResponseErrors()
    {
        $data = $this->httpResponse->json();
        
        if (Functions::data_get($data, 'error')) {
            throw Exception::providerResponseError(vsprintf(
                'Suggerence Error: [%s] %s',
                [
                    Functions::data_get($data, 'error.type', 'unknown'),
                    Functions::data_get($data, 'error.message'),
                ]
            ));
        }
    }
}
