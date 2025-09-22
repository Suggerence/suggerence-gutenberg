<?php

namespace SuggerenceGutenberg\Components\Ai\Providers\Anthropic\Maps;

use UnitEnum;

class ToolMap
{
    public static function map($tools)
    {
        return array_map(function ($tool) {
            $cacheType = $tool->providerOptions('cacheType');

            return array_filter([
                'name'          => $tool->name(),
                'description'   => $tool->description(),
                'input_schema'  => [
                    'type'          => 'object',
                    'properties'    => $tool->parametersAsArray(),
                    'required'      => $tool->requiredParameters()
                ],
                'cache_control' => $cacheType ? ['type' => $cacheType instanceof UnitEnum ? $cacheType->name : $cacheType] : null,
            ]);
        }, $tools);
    }
}
