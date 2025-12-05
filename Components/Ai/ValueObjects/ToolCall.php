<?php

namespace SuggerenceGutenberg\Components\Ai\ValueObjects;

class ToolCall
{
    public function __construct(
        public $id,
        public $name,
        public  $arguments,
        public $resultId = null,
        public $reasoningId = null,
        public $reasoningSummary = null
    ) {}

    public function arguments()
    {
        if (is_string($this->arguments)) {
            if ($this->arguments === '' || $this->arguments === '0') {
                return [];
            }

            $arguments = $this->arguments;

            return json_decode(
                $arguments,
                true,
                flags: JSON_THROW_ON_ERROR
            );
        }

        $arguments = $this->arguments;

        return $arguments;
    }
}
