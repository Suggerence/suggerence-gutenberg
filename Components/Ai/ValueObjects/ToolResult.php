<?php

namespace SuggerenceGutenberg\Components\Ai\ValueObjects;

class ToolResult
{
    public function __construct(
        public $toolCallId,
        public $toolName,
        public $args,
        public $result,
        public $toolCallResultId = null
    ) {}
}
