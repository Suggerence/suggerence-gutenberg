<?php

namespace SuggerenceGutenberg\Components\Ai\Concerns;

trait HasMessages
{
    protected $messages = [];

    public function withMessages($messages)
    {
        $this->messages = $messages;

        return $this;
    }
}
