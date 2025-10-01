<?php

namespace SuggerenceGutenberg\Components\Ai\Providers\OpenAI\Handlers;

use Illuminate\Support\Arr;
use SuggerenceGutenberg\Components\Ai\Concerns\CallsTools;
use SuggerenceGutenberg\Components\Ai\Enums\FinishReason;
use SuggerenceGutenberg\Components\Ai\Exceptions\Exception;
use SuggerenceGutenberg\Components\Ai\Providers\Anthropic\Concerns\ProcessesRateLimits;
use SuggerenceGutenberg\Components\Ai\Providers\OpenAI\Concerns\BuildsTools;
use SuggerenceGutenberg\Components\Ai\Providers\OpenAI\Concerns\ExtractsCitations;
use SuggerenceGutenberg\Components\Ai\Providers\OpenAI\Concerns\MapsFinishReason;
use SuggerenceGutenberg\Components\Ai\Providers\OpenAI\Concerns\ValidatesResponse;
use SuggerenceGutenberg\Components\Ai\Providers\OpenAI\Maps\MessageMap;
use SuggerenceGutenberg\Components\Ai\Providers\OpenAI\Maps\ToolCallMap;
use SuggerenceGutenberg\Components\Ai\Providers\OpenAI\Maps\ToolChoiceMap;
use SuggerenceGutenberg\Components\Ai\Text\ResponseBuilder;
use SuggerenceGutenberg\Components\Ai\Text\Step;
use SuggerenceGutenberg\Components\Ai\ValueObjects\Messages\AssistantMessage;
use SuggerenceGutenberg\Components\Ai\ValueObjects\Messages\ToolResultMessage;
use SuggerenceGutenberg\Components\Ai\ValueObjects\Meta;
use SuggerenceGutenberg\Components\Ai\ValueObjects\Usage;

class Text
{
    use BuildsTools;
    use CallsTools;
    use ExtractsCitations;
    use MapsFinishReason;
    use ProcessesRateLimits;
    use ValidatesResponse;

    protected $responseBuilder;

    protected $citations = null;

    public function __construct(protected $client)
    {
        $this->responseBuilder = new ResponseBuilder;
    }

    public function handle($request)
    {
        $response = $this->sendRequest($request);

        $this->validateResponse($response);

        $data = $response->json();

        $this->citations = $this->extractCitations($data);

        $responseMessage = new AssistantMessage(
            data_get($data, 'output.{last}.content.0.text') ?? '',
            ToolCallMap::map(
                array_filter(data_get($data, 'output', []), fn ($output) => $output['type'] === 'function_call'),
                array_filter(data_get($data, 'output', []), fn ($output) => $output['type'] === 'reasoning')
            ),
            Arr::whereNotNull([
                'citations' => $this->citations
            ])
        );

        $request->addMessage($responseMessage);

        return match ($this->mapFinishReason($data)) {
            FinishReason::ToolCalls => $this->handleToolCalls($data, $request, $response),
            FinishReason::Stop      => $this->handleStop($data, $request, $response),
            FinishReason::Length    => throw new Exception('OpenAI: max tokens exceeded'),
            default                 => throw new Exception('OpenAI: unknown finish reason')
        };
    }

    protected function handleToolCalls($data, $request, $clientResponse)
    {
        $toolResults = $this->callTools(
            $request->tools(),
            ToolCallMap::map(array_filter(
                data_get($data, 'output', []),
                fn ($output) => $output['type'] === 'function_call'
            ))
        );

        $request->addMessage(new ToolResultMessage($toolResults));

        $this->addStep($data, $request, $clientResponse, $toolResults);

        if ($this->shouldContinue($request)) {
            return $this->handle($request);
        }

        return $this->responseBuilder->toResponse();
    }

    protected function handleStop($data, $request, $clientResponse)
    {
        $this->addStep($data, $request, $clientResponse);

        return $this->responseBuilder->toResponse();
    }

    protected function shouldContinue($request)
    {
        return $this->responseBuilder->steps->count() < $request->maxSteps();
    }

    protected function sendRequest($request)
    {
        return $this->client->post(
            'responses',
            array_merge([
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

    protected function addStep($data, $request, $clientResponse, $toolResults = [])
    {
        $this->responseBuilder->addStep(new Step(
            data_get($data, 'output.{last}.content.0.text') ?? '',
            $this->mapFinishReason($data),
            ToolCallMap::map(array_filter(data_get($data, 'output', []), fn ($output) => $output['type'] === 'function_call')),
            $toolResults,
            new Usage(
                data_get($data, 'usage.input_tokens', 0) - data_get($data, 'usage.input_tokens_details.cached_tokens', 0),
                data_get($data, 'usage.output_tokens'),
                0,
                data_get($data, 'usage.input_tokens_details.cached_tokens'),
                data_get($data, 'usage.output_token_details.reasoning_tokens')
            ),
            new Meta(
                data_get($data, 'id'),
                data_get($data, 'model'),
                $this->processRateLimits($clientResponse)
            ),
            $request->messages(),
            $request->systemPrompts(),
            Arr::whereNotNull([
                'citations' => $this->citations
            ])
        ));
    }
}
