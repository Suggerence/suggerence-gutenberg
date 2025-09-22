<?php

namespace SuggerenceGutenberg\Components\Ai\ValueObjects;

class Citation
{
    public function __construct(
        public $sourceType,
        public $source,
        public $sourceText = null,
        public $sourceTitle = null,
        public $sourcePositionType = null,
        public $sourceStartIndex = null,
        public $sourceEndIndex = null,
        public $additionalContent = []
    ) {}
}
