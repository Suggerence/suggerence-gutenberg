<?php

namespace SuggerenceGutenberg\Components\Ai\Providers\Anthropic\Handlers\StructuredStrategies;

abstract class AnthropicStructuredStrategy
{
    public function __construct(
        protected $request
    )
    {
        $this->checkStrategySupport();
    }

    abstract public function appendMessages();

    abstract public function mutatePayload($payload);

    abstract public function mutateResponse($httpResponse, $response);

    abstract protected function checkStrategySupport();
}
