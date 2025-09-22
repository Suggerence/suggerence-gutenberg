<?php

namespace SuggerenceGutenberg\Components\Ai\Audio;

class TextResponse
{
    public function __construct(
        public $text,
        public $usage = null,
        public $additionalContent = []
    ) {}
}
