<?php

namespace SuggerenceGutenberg\Components\Ai\Images;

use SuggerenceGutenberg\Components\Ai\Concerns\ChecksSelf;
use SuggerenceGutenberg\Components\Ai\Concerns\HasProviderOptions;
use SuggerenceGutenberg\Components\Ai\Contracts\Request as AIRequest;

class Request implements AIRequest
{
    use ChecksSelf, HasProviderOptions;

    public function __construct(
        protected $model,
        protected $providerKey,
        protected $prompt,
        public $tools,
        $providerOptions,
        protected $providerTools,
        protected $clientOptions = [],
        protected $clientRetry = 3
    ) {
        $this->providerOptions = $providerOptions;
    }

    public function model()
    {
        return $this->model;
    }

    public function prompt()
    {
        return $this->prompt;
    }

    public function tools()
    {
        return $this->tools;
    }

    public function providerTools()
    {
        return $this->providerTools;
    }

    public function provider()
    {
        return $this->providerKey;
    }

    public function clientOptions()
    {
        return $this->clientOptions;
    }

    public function clientRetry()
    {
        return $this->clientRetry;
    }

    public function toArray(): array
    {
        return [
            'model' => $this->model,
            'prompt' => $this->prompt,
            'providerOptions' => $this->providerOptions,
            'tools' => $this->tools,
            'providerTools' => $this->providerTools,
        ];
    }
}
