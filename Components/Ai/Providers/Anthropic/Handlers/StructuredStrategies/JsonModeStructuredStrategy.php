<?php

namespace SuggerenceGutenberg\Components\Ai\Providers\Anthropic\Handlers\StructuredStrategies;

use SuggerenceGutenberg\Components\Ai\ValueObjects\Messages\UserMessage;

class JsonModeStructuredStrategy extends AnthropicStructuredStrategy
{
    public function appendMessages(): void
    {
        $this->request->addMessage(new UserMessage(sprintf(
            "Respond with ONLY JSON (i.e. not in backticks or a code block, with NO CONTENT outside the JSON) that matches the following schema: \n %s %s",
            json_encode($this->request->schema()->toArray(), JSON_PRETTY_PRINT),
            ($this->request->providerOptions()['citations'] ?? false)
                ? "\n\n Return the JSON as a single text block with a single set of citations."
                : ''
        )));
    }

    public function mutatePayload($payload)
    {
        return $payload;
    }

    public function mutateResponse($httpResponse, $prismResponse)
    {
        return $prismResponse;
    }

    protected function checkStrategySupport() {}
}
