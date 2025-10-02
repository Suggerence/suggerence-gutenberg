<?php

namespace SuggerenceGutenberg\Components\Ai\Providers\Gemini\Maps;

use SuggerenceGutenberg\Components\Ai\Helpers\Functions;

class ToolMap
{
    public static function map($tools)
    {
        if ($tools === []) {
            return [];
        }

        return array_map(fn ($tool) => [
            'name'          => $tool->name(),
            'description'   => $tool->description(),
            ...$tool->hasParameters() ? [
                'parameters'    => [
                    'type'          => 'object',
                    'properties'    => self::mapProperties($tool->parameters()),
                    'required'      => $tool->requiredParameters()
                ]
            ] : []
        ], $tools);
    }

    protected static function mapProperties($properties)
    {
        return Functions::map_with_keys($properties, fn ($schema, $name) => [
            $name => (new SchemaMap($schema))->toArray()
        ]);
    }
}
