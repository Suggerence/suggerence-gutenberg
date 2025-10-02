<?php

namespace SuggerenceGutenberg\Components\Ai\Schema;

use SuggerenceGutenberg\Components\Ai\Concerns\NullableSchema;
use SuggerenceGutenberg\Components\Ai\Contracts\Schema;
use SuggerenceGutenberg\Components\Ai\Helpers\Functions;

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
        $array = [
            'description'           => $this->description,
            'type'                  => $this->nullable ? $this->castToNullable('object') : 'object',
            'additionalProperties'  => $this->allowAdditionalProperties
        ];

        $properties = $this->propertiesArray();
        if (!empty($properties)) {
            $array['properties'] = $properties;
        }

        if (!empty($this->requiredFields)) {
            $array['required'] = $this->requiredFields;
        }

        return $array;
    }

    protected function propertiesArray()
    {
        return Functions::collect($this->properties)
            ->keyBy(fn ($parameter) => $parameter->name())
            ->map(fn ($parameter) => $parameter->toArray())
            ->toArray();
    }
}
