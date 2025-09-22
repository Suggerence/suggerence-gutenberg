<?php

namespace SuggerenceGutenberg\Components\Ai\Schema;

use SuggerenceGutenberg\Components\Ai\Concerns\NullableSchema;
use SuggerenceGutenberg\Components\Ai\Contracts\Schema;

class StringSchema implements Schema
{
    use NullableSchema;

    public function __construct(
        public $name,
        public $description,
        public $nullable = false
    ) {}

    #[\Override]
    public function name()
    {
        return $this->name;
    }

    public function toArray()
    {
        return [
            'description'   => $this->description,
            'type'          => $this->nullable ? $this->castToNullable('string') : 'string'
        ];
    }
}
