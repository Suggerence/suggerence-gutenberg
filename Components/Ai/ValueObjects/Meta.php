<?php

namespace SuggerenceGutenberg\Components\Ai\ValueObjects;

class Meta
{
    public function __construct(
        public $id,
        public $model,
        public $rateLimits = []
    ) {}
}
