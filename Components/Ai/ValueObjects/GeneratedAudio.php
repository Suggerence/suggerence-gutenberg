<?php

namespace SuggerenceGutenberg\Components\Ai\ValueObjects;

class GeneratedAudio
{
    public function __construct(
        public $base64 = null,
        public $type = null
    ) {}

    public function hasBase64()
    {
        return $this->base64 !== null;
    }

    public function getMimeType()
    {
        return $this->type;
    }
}
