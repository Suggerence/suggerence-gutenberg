<?php

namespace SuggerenceGutenberg\Components\Ai\ValueObjects;

class EmbeddingsUsage
{
    public function __construct(
        public $tokens
    ) {}
}
