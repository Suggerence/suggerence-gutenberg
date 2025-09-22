<?php

namespace SuggerenceGutenberg\Components\Ai\Providers\Gemini\Handlers;

use Illuminate\Support\Arr;
use SuggerenceGutenberg\Components\Ai\Exceptions\Exception;
use SuggerenceGutenberg\Components\Ai\Providers\Gemini\Concerns\ValidatesResponse;
use SuggerenceGutenberg\Components\Ai\Providers\Gemini\Maps\FinishReasonMap;
use SuggerenceGutenberg\Components\Ai\Providers\Gemini\Maps\MessageMap;
use SuggerenceGutenberg\Components\Ai\Providers\Gemini\Maps\SchemaMap;
use SuggerenceGutenberg\Components\Ai\Structured\ResponseBuilder;
use SuggerenceGutenberg\Components\Ai\Structured\Step;
use SuggerenceGutenberg\Components\Ai\ValueObjects\Messages\AssistantMessage;
use SuggerenceGutenberg\Components\Ai\ValueObjects\Meta;
use SuggerenceGutenberg\Components\Ai\ValueObjects\Usage;

class Structured
{
    use ValidatesResponse;

    protected $responseBuilder;

    public function __construct(protected $client)
    {
        $this->responseBuilder = new ResponseBuilder;
    }

    public function handle($request)
    {
        $data = $this->sendRequest($request);

        $this->validateResponse($data);

        $responseMessage = new AssistantMessage(data_get($data, 'candidates.0.content.parts.0.text') ?? '');

        $request->addMessage($responseMessage);

        $this->addStep($data, $request);
        
        return $this->responseBuilder->toResponse();
    }

    public function sendRequest($request)
    {
        $providerOptions = $request->providerOptions();

        $response = $this->client->post(
            "models/{$request->model()}:generateContent",
            Arr::whereNotNull([
                ...(new MessageMap($request->messages(), $request->systemPrompts()))(),
                'cachedContent'     => $providerOptions['cachedContentName'] ?? null,
                'generationConfig'  => Arr::whereNotNull([
                    'response_mime_type'    => 'application/json',
                    'response_schema'       => (new SchemaMap($request->schema()))->toArray(),
                    'temperature'           => $request->temperature(),
                    'topP'                  => $request->topP(),
                    'maxOutputTokens'       => $request->maxTokens(),
                    'thinkingConfig'        => Arr::whereNotNull([
                        'thinkingBudget'      => $providerOptions['thinkingBudget'] ?? null
                    ]) ?? null
                ]),
                'safetySettings'    => $providerOptions['safetySettings'] ?? null
            ])
        );

        return $response->json();
    }

    protected function validateResponse($data)
    {
        if (!$data || data_get($data, 'error')) {
            throw Exception::providerResponseError(vsprintf(
                'Gemini Error: [%s] %s',
                [
                    data_get($data, 'error.code', 'unknown'),
                    data_get($data, 'error.message', 'unknown'),
                ]
            ));
        }

        $finishReason   = data_get($data, 'candidates.0.finishReason');
        $content        = data_get($data, 'candidates.0.content.parts.0.text', '');
        $thoughtTokens  = data_get($data, 'usageMetadata.thoughtsTokenCount', 0);

        if ($finishReason === 'MAX_TOKENS') {
            $promptTokens       = data_get($data, 'usageMetadata.promptTokenCount', 0);
            $candidatesTokens   = data_get($data, 'usageMetadata.candidatesTokenCount', 0);
            $totalTokens        = data_get($data, 'usageMetadata.totalTokenCount', 0);
            $outputTokens       = $candidatesTokens - $thoughtTokens;

            $isEmpty            = in_array(trim((string) $content), ['', '0'], true);
            $isInvalidJson      = !empty($content) && json_decode((string) $content) === null;
            $contentLength      = strlen((string) $content);

            if (($isEmpty || $isInvalidJson) && $thoughtTokens > 0) {
                $errorDetail = $isEmpty ? 'no tokens remained for structured output' : "output was truncated at {$contentLength} characters resulting in invalid JSON";

                throw Exception::providerResponseError(
                    'Gemini hit token limit with high thinking token usage. ' .
                    "Token usage: {$promptTokens} prompt + {$thoughtTokens} thinking + {$outputTokens} output = {$totalTokens} total. " .
                    "The {$errorDetail}. " .
                    'Try increasing maxTokens to at least ' . ($totalTokens + 1000) . ' (suggested: ' . ($totalTokens * 2) . ' for comfortable margin)'
                );
            }
        }
    }

    protected function addStep($data, $request)
    {
        $this->responseBuilder->addStep(
            new Step(
                data_get($data, 'candidates.0.content.parts.0.text') ?? '',
                FinishReasonMap::map(data_get($data, 'candidates.0.finishReason')),
                new Usage(
                    data_get($data, 'usageMetadata.promptTokenCount', 0),
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
                $request->systemPrompts()
            )
        );
    }
}
