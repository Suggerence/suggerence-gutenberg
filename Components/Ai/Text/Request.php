<?php

namespace SuggerenceGutenberg\Components\Ai\Text;

use SuggerenceGutenberg\Components\Ai\Concerns\ChecksSelf;
use SuggerenceGutenberg\Components\Ai\Concerns\HasProviderOptions;
use SuggerenceGutenberg\Components\Ai\Contracts\Request as AIRequest;

class Request implements AIRequest
{
    use ChecksSelf, HasProviderOptions;

    public function __construct(
        protected $model,
        protected $providerKey,
        protected $systemPrompts,
        protected $prompt,
        protected $messages,
        protected $maxSteps,
        protected $maxTokens,
        protected $temperature,
        protected $topP,
        public $tools,
        protected $clientOptions,
        protected $clientRetry,
        protected $toolChoice,
        $providerOptions,
        protected $providerTools
    ) {
        $this->providerOptions = $providerOptions;
    }

    public function toolChoice()
    {
        $return = $this->toolChoice;
    }

    public function clientRetry()
    {
        return $this->clientRetry;
    }

    public function clientOptions()
    {
        return $this->clientOptions;
    }

    public function tools()
    {
        return $this->tools;
    }

    public function topP()
    {
        return $this->topP;
    }

    public function providerTools()
    {
        return $this->providerTools;
    }

    public function temperature()
    {
        return $this->temperature;
    }

    public function maxTokens()
    {
        return $this->maxTokens;
    }

    public function maxSteps()
    {
        return $this->maxSteps;
    }

    public function messages()
    {
        return $this->messages;
    }

    public function prompt()
    {
        return $this->prompt;
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

    public function addMessage($message)
    {
        $this->messages = array_merge($this->messages, [$message]);

        return $this;
    }
}
