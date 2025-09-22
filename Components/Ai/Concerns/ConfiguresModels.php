<?php

namespace SuggerenceGutenberg\Components\Ai\Concerns;

trait ConfiguresModels
{
    protected $maxTokens = 2048;

    protected $temperature = null;

    protected $topP = null;

    public function withMaxTokens($maxTokens)
    {
        $this->maxTokens = $maxTokens;

        return $this;
    }

    public function usingTemperature($temperature)
    {
        $this->temperature = $temperature;

        return $this;
    }
    
    public function usingTopP($topP)
    {
        $this->topP = $topP;

        return $this;
    }
}
