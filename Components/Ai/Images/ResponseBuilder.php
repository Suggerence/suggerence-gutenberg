<?php

namespace SuggerenceGutenberg\Components\Ai\Images;

class ResponseBuilder
{
    public function __construct(
        public $usage,
        public $meta,
        public $images = [],
        public $additionalContent = [],
    ) {}

    public function toResponse()
    {
        return new Response(
            $this->images,
            $this->usage,
            $this->meta,
            $this->additionalContent
        );
    }
}
