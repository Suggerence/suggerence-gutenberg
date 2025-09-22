<?php

namespace SuggerenceGutenberg\Components\Ai\Images;

class Response
{
    public function __construct(
        public $images,
        public $usage,
        public $meta,
        public $additionalContent = [],
    ) {}

    public function firstImage()
    {
        return $this->images[0] ?? null;
    }

    public function hasImages()
    {
        return $this->images !== [];
    }

    public function imageCount()
    {
        return count($this->images);
    }
}
