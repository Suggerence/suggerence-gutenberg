<?php

namespace SuggerenceGutenberg\Components\Ai\Providers\Gemini\Maps;

use SuggerenceGutenberg\Components\Ai\Schema\ArraySchema;
use SuggerenceGutenberg\Components\Ai\Schema\BooleanSchema;
use SuggerenceGutenberg\Components\Ai\Schema\NumberSchema;
use SuggerenceGutenberg\Components\Ai\Schema\ObjectSchema;

class SchemaMap
{
    public function __construct(private $schema) {}

    public function toArray()
    {
        $schemaArray = $this->schema->toArray();

        unset($schemaArray['additionalProperties'], $schemaArray['description'], $schemaArray['name']);

        return array_merge(
            array_filter([
                ...$schemaArray,
                'type' => $this->mapType()
            ]),
            array_filter([
                'items'         => property_exists($this->schema, 'items') && $this->schema->items
                    ? (new self($this->schema->items))->toArray()
                    : null,
                'properties'    => $this->schema instanceof ObjectSchema && property_exists($this->schema, 'properties')
                    ? array_reduce($this->schema->properties, function ($carry, $property) {
                        $carry[$property->name()] = (new self($property))->toArray();

                        return $carry;
                    }, [])
                    : null,
                'nullable'      => property_exists($this->schema, 'nullable') && $this->schema->nullable
                    ? true
                    : null
            ])
        );
    }

    protected function mapType()
    {
        if ($this->schema instanceof ArraySchema) {
            return 'array';
        }
        if ($this->schema instanceof BooleanSchema) {
            return 'boolean';
        }
        if ($this->schema instanceof NumberSchema) {
            return 'number';
        }
        if ($this->schema instanceof ObjectSchema) {
            return 'object';
        }

        return 'string';
    }
}
