<?php

namespace SuggerenceGutenberg\Components\Ai\Text;

use SuggerenceGutenberg\Components\Ai\Enums\ChunkType;

class Chunk
{
    public function __construct(
        public $text,
        public $toolCalls = [],
        public $toolResults = [],
        public $finishReason = null,
        public $meta = null,
        public $additionalContent = [],
        public $chunkType = ChunkType::Text,
        public $usage = null,
    ) {}
}
