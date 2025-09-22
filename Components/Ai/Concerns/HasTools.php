<?php

namespace SuggerenceGutenberg\Components\Ai\Concerns;

trait HasTools
{
    protected $tools = [];

    protected $toolErrorHandlingEnabled = true;

    public function withTools($tools)
    {
        $this->tools = $tools;

        return $this;
    }
    
    public function withoutToolErrorHandling()
    {
        $this->toolErrorHandlingEnabled = false;

        return $this;
    }
}
