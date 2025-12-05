<?php

namespace SuggerenceGutenberg\Components\Ai\ValueObjects;

class GeneratedImage
{
    public function __construct(
        public $url             = null,
        public $base64          = null,
        public $revisedPrompt   = null,
        public $mimeType        = null
    ) {}

    public function hasUrl()
    {
        return $this->url !== null;
    }

    public function hasBase64()
    {
        return $this->base64 !== null;
    }

    public function hasRevisedPrompt()
    {
        return $this->revisedPrompt !== null;
    }

    public function hasMimeType()
    {
        return $this->mimeType !== null;
    }
}
