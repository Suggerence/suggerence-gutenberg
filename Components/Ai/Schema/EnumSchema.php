<?php

namespace SuggerenceGutenberg\Components\Ai\Schema;

use SuggerenceGutenberg\Components\Ai\Contracts\Schema;

class EnumSchema implements Schema
{
    public function __construct(
        public $name,
        public $description,
        public $options,
        public $nullable = false
    ) {}
    
    #[\Override]
    public function name()
    {
        return $this->name;
    }
    
    
    #[\Override]
    public function toArray()
    {
        return [
            'description'   => $this->description,
            'enum'          => $this->options,
            'type'          => $this->types()
        ];
    }

    protected function types()
    {
        $types = $this->resolveTypes();

        if ($this->nullable) {
            $types[] = 'null';
        }

        if ($this->hasSingleType($types)) {
            return $types[0];
        }

        return $types;
    }

    protected function hasSingleType($types)
    {
        return count($types) === 1;
    }

    protected function resolveTypes()
    {
        return collect($this->options)
            ->map(fn ($option) => match (gettype($option)) {
                'integer', 'double' => 'number',
                'string'            => 'string',
            })
            ->unique()
            ->values()
            ->toArray();
    }
}
