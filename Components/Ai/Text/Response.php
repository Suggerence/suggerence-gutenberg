<?php

namespace SuggerenceGutenberg\Components\Ai\Text;

class Response
{
    public function __construct(
        public $steps,
        public $text,
        public $finishReason,
        public $toolCalls,
        public $toolResults,
        public $usage,
        public $meta,
        public $messages,
        public $additionalContent = []
    ) {}
}
