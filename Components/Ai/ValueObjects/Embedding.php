<?php

namespace SuggerenceGutenberg\Components\Ai\ValueObjects;

class Embedding
{
    public function __construct(
        public $embedding,
    ) {}

    public static function fromArray($embedding)
    {
        return new self($embedding);
    }
}
