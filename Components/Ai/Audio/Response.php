<?php

namespace SuggerenceGutenberg\Components\Ai\Audio;

class Response
{
    public function __construct(
        public $audio,
        public $additionalContent = []
    ) {}
}
