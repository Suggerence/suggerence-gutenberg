<?php

namespace SuggerenceGutenberg\Components\Ai\ValueObjects;

class MessagePartWithCitations
{
    public function __construct(
        public $outputText,
        public $citations = [],
        public $additionalContent = []
    ) {}
}
