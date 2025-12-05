<?php

namespace SuggerenceGutenberg\Components\Ai\Providers\Anthropic\Handlers\StructuredStrategies;

use SuggerenceGutenberg\Components\Ai\Exceptions\Exception;
use SuggerenceGutenberg\Components\Ai\Structured\Response;
use SuggerenceGutenberg\Components\Ai\ValueObjects\Messages\UserMessage;
use SuggerenceGutenberg\Components\Ai\Helpers\Functions;

class ToolStructuredStrategy extends AnthropicStructuredStrategy
{
    public function appendMessages()
    {
        if ($this->request->providerOptions('thinking.enabled') === false) {
            return;
        }

        $this->request->addMessage(new UserMessage(sprintf(
            "Please use the output_structured_data tool to provide your response. If for any reason you cannot use the tool, respond with ONLY JSON (i.e. not in backticks or a code block, with NO CONTENT outside the JSON) that matches the following schema: \n %s",
            json_encode($this->request->schema()->toArray(), JSON_PRETTY_PRINT)
        )));
    }

    public function mutatePayload($payload)
    {
        $schemaArray = $this->request->schema()->toArray();

        $payload = [
            ...$payload,
            'tools' => [
                [
                    'name' => 'output_structured_data',
                    'description' => 'Output data in the requested structure',
                    'input_schema' => [
                        'type' => 'object',
                        'properties' => $schemaArray['properties'],
                        'required' => $schemaArray['required'] ?? [],
                        'additionalProperties' => false,
                    ],
                ],
            ],
        ];

        if ($this->request->providerOptions('thinking.enabled') !== true) {
            $payload['tool_choice'] = ['type' => 'tool', 'name' => 'output_structured_data'];
        }

        return $payload;
    }

    public function mutateResponse($httpResponse, $response)
    {
        $structured = [];
        $additionalContent = $response->additionalContent;

        $data = $httpResponse->json();

        $toolCalls = array_values(array_filter(
            Functions::data_get($data, 'content', []),
            fn($content): bool => Functions::data_get($content, 'type') === 'tool_use' && Functions::data_get($content, 'name') === 'output_structured_data'
        ));

        $structured = Functions::data_get($toolCalls, '0.input', []);

        return new Response(
            steps: $response->steps,
            text: $response->text,
            structured: $structured,
            finishReason: $response->finishReason,
            usage: $response->usage,
            meta: $response->meta,
            additionalContent: $additionalContent
        );
    }

    protected function checkStrategySupport(): void
    {
        if ($this->request->providerOptions('citations') === true) {
            throw new Exception(
                'Citations are not supported with tool calling mode. Please set use_tool_calling to false in provider options to use citations.'
            );
        }
    }
}
