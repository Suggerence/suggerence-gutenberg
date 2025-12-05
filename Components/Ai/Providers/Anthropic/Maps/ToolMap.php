<?php

namespace SuggerenceGutenberg\Components\Ai\Providers\Anthropic\Maps;

use UnitEnum;

class ToolMap
{
    public static function map($tools)
    {
        return array_map(function ($tool) {
            $cacheType = $tool->providerOptions('cacheType');

            $inputSchema = [
                'type' => 'object'
            ];
            
            $properties = $tool->parametersAsArray();
            $required = $tool->requiredParameters();
            
            // Only include properties if not empty, and clean nested empty arrays
            if (!empty($properties)) {
                $inputSchema['properties'] = static::cleanEmptyArrays($properties);
            }
            
            // Only include required if not empty
            if (!empty($required)) {
                $inputSchema['required'] = $required;
            }

            return array_filter([
                'name'          => $tool->name(),
                'description'   => $tool->description(),
                'input_schema'  => $inputSchema,
                'cache_control' => $cacheType ? ['type' => $cacheType instanceof UnitEnum ? $cacheType->name : $cacheType] : null,
            ]);
        }, $tools);
    }
    
    /**
     * Recursively remove empty properties and required arrays from schema
     */
    protected static function cleanEmptyArrays($data)
    {
        if (!is_array($data)) {
            return $data;
        }
        
        $cleaned = [];
        
        foreach ($data as $key => $value) {
            if (is_array($value)) {
                // If it's an empty array and the key is 'properties' or 'required', skip it
                if (empty($value) && in_array($key, ['properties', 'required'])) {
                    continue;
                }
                
                // Recursively clean nested arrays
                $cleanedValue = static::cleanEmptyArrays($value);
                
                // Only add if it's not an empty array for properties/required keys
                if (!(empty($cleanedValue) && in_array($key, ['properties', 'required']))) {
                    $cleaned[$key] = $cleanedValue;
                }
            } else {
                $cleaned[$key] = $value;
            }
        }
        
        return $cleaned;
    }
}
