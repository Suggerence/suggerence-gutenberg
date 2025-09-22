<?php

namespace SuggerenceGutenberg\Components\Ai\Structured;

use Closure;
use SuggerenceGutenberg\Components\Ai\Concerns\ChecksSelf;
use SuggerenceGutenberg\Components\Ai\Concerns\HasProviderOptions;
use SuggerenceGutenberg\Components\Ai\Contracts\Request as AIRequest;

class Request implements AIRequest
{
    use ChecksSelf, HasProviderOptions;

    public function __construct(
        protected $systemPrompts,
        protected $model,
        protected $providerKey,
        protected $prompt,
        protected $messages,
        protected $maxTokens,
        protected $temperature,
        protected $topP,
        protected $clientOptions,
        protected $clientRetry,
        protected $schema,
        protected $mode,
        $providerOptions = [],
    ) {
        $this->providerOptions = $providerOptions;
    }

    public function systemPrompts()
    {
        return $this->systemPrompts;
    }

    #[\Override]
    public function model()
    {
        return $this->model;
    }

    public function provider()
    {
        return $this->providerKey;
    }

    public function prompt()
    {
        return $this->prompt;
    }

    public function messages()
    {
        return $this->messages;
    }

    public function maxTokens()
    {
        return $this->maxTokens;
    }

    public function temperature()
    {
        return $this->temperature;
    }

    public function topP()
    {
        return $this->topP;
    }

    public function clientOptions()
    {
        return $this->clientOptions;
    }

    public function clientRetry()
    {
        return $this->clientRetry;
    }

    public function schema()
    {
        return $this->schema;
    }

    public function mode()
    {
        return $this->mode;
    }

    public function addMessage($message)
    {
        $this->messages = array_merge($this->messages, [$message]);

        return $this;
    }
}
