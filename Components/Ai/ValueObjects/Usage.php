<?php

namespace SuggerenceGutenberg\Components\Ai\ValueObjects;

class Usage
{
    public function __construct(
        public $promptTokens,
        public $completionTokens,
        public $cacheWriteInputTokens = null,
        public $cacheReadInputTokens = null,
        public $thoughtTokens = null
    ) {}
}
