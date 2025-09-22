<?php

namespace SuggerenceGutenberg\Components\Ai\Providers\OpenAI\Maps;

class ToolMap
{
    public static function map($tools)
    {
        return array_map(fn ($tool) => array_filter([
            'type'          => 'function',
            'name'          => $tool->name(),
            'description'   => $tool->description(),
            ...count($tool->parameters()) ? [
                'parameters'    => [
                    'type'          => 'object',
                    'properties'    => $tool->parametersAsArray(),
                    'required'      => $tool->requiredParameters()
                ]
            ] : [],
            'strict'        => $tool->providerOptions('strict')
        ]), $tools);
    }
}
