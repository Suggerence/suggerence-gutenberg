<?php

namespace SuggerenceGutenberg\Components\Ai\Embeddings;

class Response
{
    public function __construct(
        public $embeddings,
        public $usage,
        public $meta,
    ) {}
}
