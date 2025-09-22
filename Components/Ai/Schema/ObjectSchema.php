<?php

namespace SuggerenceGutenberg\Components\Ai\Schema;

use SuggerenceGutenberg\Components\Ai\Concerns\NullableSchema;
use SuggerenceGutenberg\Components\Ai\Contracts\Schema;

class ObjectSchema implements Schema
{
    use NullableSchema;

    public function __construct(
        public $name,
        public $description,
        public $properties,
        public $requiredFields = [],
        public $allowAdditionalProperties = false,
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
            'description'           => $this->description,
            'type'                  => $this->nullable ? $this->castToNullable('object') : 'object',
            'properties'            => $this->propertiesArray(),
            'required'              => $this->requiredFields,
            'additionalProperties'  => $this->allowAdditionalProperties
        ];
    }

    protected function propertiesArray()
    {
        return collect($this->properties)
            ->keyBy(fn ($parameter) => $parameter->name())
            ->map(fn ($parameter) => $parameter->toArray())
            ->toArray();
    }
}
