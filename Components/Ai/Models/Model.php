<?php

namespace SuggerenceGutenberg\Components\Ai\Models;

class Model
{
    public function __construct(
        public $id,
        public $name,
        public $provider,
        public $providerName,
        public $capabilities = null,
        public $date = ''
    ) {}
}
