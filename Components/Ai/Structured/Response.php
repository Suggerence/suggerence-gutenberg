<?php

namespace SuggerenceGutenberg\Components\Ai\Structured;

class Response
{
    public function __construct(
        public $steps,
        public $text,
        public $structured,
        public $finishReason,
        public $usage,
        public $meta,
        public $additionalContent = []
    ) {}
}
