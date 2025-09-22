<?php

namespace SuggerenceGutenberg\Components\Ai\Providers\OpenAI\Handlers;

use Illuminate\Support\Arr;
use SuggerenceGutenberg\Components\Ai\Exceptions\Exception;
use SuggerenceGutenberg\Components\Ai\Providers\OpenAI\Concerns\ExtractsCitations;
use SuggerenceGutenberg\Components\Ai\Providers\OpenAI\Concerns\MapsFinishReason;
use SuggerenceGutenberg\Components\Ai\Providers\OpenAI\Concerns\ProcessRateLimits;
use SuggerenceGutenberg\Components\Ai\Providers\OpenAI\Concerns\ValidatesResponse;
use SuggerenceGutenberg\Components\Ai\Providers\OpenAI\Maps\MessageMap;
use SuggerenceGutenberg\Components\Ai\Structured\ResponseBuilder;
use SuggerenceGutenberg\Components\Ai\Structured\Step;
use SuggerenceGutenberg\Components\Ai\ValueObjects\Messages\AssistantMessage;
use SuggerenceGutenberg\Components\Ai\ValueObjects\Messages\SystemMessage;
use SuggerenceGutenberg\Components\Ai\ValueObjects\Meta;
use SuggerenceGutenberg\Components\Ai\ValueObjects\Usage;
use SuggerenceGutenberg\Components\Ai\Enums\StructuredMode;
use SuggerenceGutenberg\Components\Ai\Providers\OpenAI\Support\StructuredModeResolver;

class Structured
{
    use ExtractsCitations;
    use MapsFinishReason;
    use ProcessRateLimits;
    use ValidatesResponse;

    protected $responseBuilder;

    public function __construct(protected $client)
    {
        $this->responseBuilder = new ResponseBuilder;
    }

    public function handle($request)
    {
        $response = match ($request->mode()) {
            StructuredMode::Auto        => $this->handleAutoMode($request),
            StructuredMode::Structured  => $this->handleStructuredMode($request),
            StructuredMode::Json        => $this->handleJsonMode($request)
        };

        $this->validateResponse($response);

        $data = $response->json();

        $this->handleRefusal(data_get($data, 'output.{last}.content.0', []));

        $responseMessage = new AssistantMessage(
            data_get($data, 'output.{last}.content.0.text') ?? '',
        );

        $request->addMessage($responseMessage);

        $this->addStep($data, $request, $response);

        return $this->responseBuilder->toResponse();
    }

    protected function addStep($data, $request, $clientResponse)
    {
        $this->responseBuilder->addStep(new Step(
            data_get($data, 'output.{last}.content.0.text') ?? '',
            $this->mapFinishReason($data),
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
                'citations' => $this->extractCitations($data)
            ])
        ));
    }

    protected function sendRequest($request, $responseFormat)
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
                'previous_response_id'  => $request->providerOptions('previous_response_id'),
                'truncation'            => $request->providerOptions('truncation'),
                'reasoning'             => $request->providerOptions('reasoning'),
                'text'                  => [
                    'format' => $responseFormat
                ]
            ]))
        );
    }

    protected function handleAutoMode($request)
    {
        $mode = StructuredModeResolver::forModel($request->model());

        return match ($mode) {
            StructuredMode::Structured  => $this->handleStructuredMode($request),
            StructuredMode::Json        => $this->handleJsonMode($request),
            default                     => throw new Exception('Could not determine structured mode for your request')
        };
    }

    protected function handleStructuredMode($request)
    {
        $mode = StructuredModeResolver::forModel($request->model());

        if ($mode !== StructuredMode::Structured) {
            throw new Exception(sprintf('%s model does not support structured mode', $request->model()));
        }

        $responseFormat = Arr::whereNotNull([
            'type'      => 'json_schema',
            'name'      => $request->schema()->name(),
            'schema'    => $request->schema()->toArray(),
            'strict'    => is_null($request->providerOptions('schema.strict'))
                ? null
                : $request->providerOptions('schema.strict')
        ]);

        return $this->sendRequest($request, $responseFormat);
    }

    protected function handleJsonMode($request)
    {
        $request = $this->appendMessageForJsonMode($request);

        return $this->sendRequest($request, [
            'type' => 'json_object',
        ]);
    }

    protected function handleRefusal($message)
    {
        if (data_get($message, 'type') === 'refusal') {
            throw new Exception(sprintf('OpenAI Refusal: %s', $message['refusal'] ?? 'Reason unknown'));
        }
    }

    protected function appendMessageForJsonMode($request)
    {
        return $request->addMessage(new SystemMessage(sprintf(
            "Respond with JSON that matches the following schema: \n %s",
            json_encode($request->schema()->toArray(), JSON_PRETTY_PRINT)
        )));
    }
}
