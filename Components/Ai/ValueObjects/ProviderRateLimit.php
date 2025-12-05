<?php

namespace SuggerenceGutenberg\Components\Ai\ValueObjects;

class ProviderRateLimit
{
    public function __construct(
        public $name,
        public $limit,
        public $remaining,
        public $resetsAt
    ) {}
}
