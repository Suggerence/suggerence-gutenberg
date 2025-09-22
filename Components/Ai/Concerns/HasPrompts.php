<?php

namespace SuggerenceGutenberg\Components\Ai\Concerns;

use SuggerenceGutenberg\Components\Ai\ValueObjects\Messages\SystemMessage;

trait HasPrompts
{
    protected $prompt = null;

    protected $additionalContent = [];

    protected $systemPrompts = [];

    public function withPrompt($prompt, $additionalContent = [])
    {
        $this->prompt               = is_string($prompt) ? $prompt : $prompt->render();
        $this->additionalContent    = $additionalContent;

        return $this;
    }

    public function withSystemPrompt($message)
    {
        if ($message instanceof SystemMessage) {
            $this->systemPrompts[] = $message;

            return $this;
        }

        $this->systemPrompts[] = new SystemMessage(is_string($message) ? $message : $message->render());

        return $this;
    }

    public function withSystemPrompts($messages)
    {
        $this->systemPrompts = $messages;

        return $this;
    }
}
