<?php

namespace SuggerenceGutenberg\Components\Ai\Structured;

class Step
{
    public function __construct(
        public $text,
        public $finishReason,
        public $usage,
        public $meta,
        public $messages,
        public $systemPrompts,
        public $additionalContent = [],
        public $structured = []
    ) {}
}
