<?php

namespace SuggerenceGutenberg\Components\Ai\Concerns;

use SuggerenceGutenberg\Components\Ai\Tool;

trait ConfiguresTools
{
    protected $toolChoice = null;

    public function withToolChoice($toolChoice)
    {
        $this->toolChoice = $toolChoice instanceof Tool
            ? $toolChoice->name()
            : $toolChoice;

        return $this;
    }
}
