<?php

namespace SuggerenceGutenberg\Components\Ai\Text;

class Step
{
    public function __construct(
        public $text,
        public $finishReason,
        public $toolCalls,
        public $toolResults,
        public $usage,
        public $meta,
        public $messages,
        public $systemPrompts,
        public $additionalContent = []
    ) {}
}
