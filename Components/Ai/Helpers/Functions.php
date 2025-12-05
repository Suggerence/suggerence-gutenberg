<?php

namespace SuggerenceGutenberg\Components\Ai\Helpers;

class Functions
{
    public static function class_basename($class)
    {
        $reflection = new \ReflectionClass($class);
        return $reflection->getShortName();
    }

    public static function map_with_keys($array, $callback)
    {
        $result = [];
        
        foreach ($array as $key => $value) {
            $mapped = $callback($value, $key);
            
            if (is_array($mapped)) {
                foreach ($mapped as $newKey => $newValue) {
                    $result[$newKey] = $newValue;
                }
            }
        }
        
        return $result;
    }

    public static function where_not_null($array)
    {
        return array_filter($array, function ($value) {
            return $value !== null;
        });
    }

    public static function arr_map($array, $callback)
    {
        $result = [];
        
        foreach ($array as $key => $value) {
            $result[$key] = $callback($value, $key);
        }
        
        return $result;
    }

    public static function arr_first($array, $callback = null, $default = null)
    {
        if (is_null($callback)) {
            if (empty($array)) {
                return $default;
            }
            
            foreach ($array as $item) {
                return $item;
            }
        }
        
        foreach ($array as $key => $value) {
            if ($callback($value, $key)) {
                return $value;
            }
        }
        
        return $default;
    }

    public static function arr_dot($array, $prepend = '')
    {
        $results = [];
        
        foreach ($array as $key => $value) {
            if (is_array($value) && !empty($value)) {
                $results = array_merge($results, self::arr_dot($value, $prepend . $key . '.'));
            } else {
                $results[$prepend . $key] = $value;
            }
        }
        
        return $results;
    }

    public static function arr_set(&$array, $key, $value)
    {
        if (is_null($key)) {
            return $array = $value;
        }
        
        $keys = explode('.', $key);
        
        while (count($keys) > 1) {
            $key = array_shift($keys);
            
            // If the key doesn't exist at this depth, we will just create an empty array
            // to hold the next value, allowing us to create the arrays to hold final
            // values at the correct depth. Then we'll keep digging into the array.
            if (!isset($array[$key]) || !is_array($array[$key])) {
                $array[$key] = [];
            }
            
            $array = &$array[$key];
        }
        
        $array[array_shift($keys)] = $value;
        
        return $array;
    }

    public static function arr_get($array, $key, $default = null)
    {
        if (is_null($key)) {
            return $array;
        }
        
        if (isset($array[$key])) {
            return $array[$key];
        }
        
        if (strpos($key, '.') === false) {
            return isset($array[$key]) ? $array[$key] : $default;
        }
        
        foreach (explode('.', $key) as $segment) {
            if (is_array($array) && isset($array[$segment])) {
                $array = $array[$segment];
            } else {
                return $default;
            }
        }
        
        return $array;
    }

    public static function data_get($target, $key, $default = null)
    {
        if (is_null($key)) {
            return $target;
        }
        
        $segments = is_array($key) ? $key : explode('.', $key);
        
        foreach ($segments as $segment) {
            // Handle wildcards and special keys
            if ($segment === '*') {
                if (!is_array($target) && !$target instanceof \Traversable) {
                    return $default;
                }
                
                $result = [];
                foreach ($target as $item) {
                    $result[] = self::data_get($item, implode('.', array_slice($segments, array_search($segment, $segments) + 1)), $default);
                }
                
                return in_array('*', $segments) ? $result : array_values($result);
            }
            
            // Handle {last} wildcard
            if ($segment === '{last}') {
                if (is_array($target)) {
                    $target = end($target);
                } elseif (is_object($target)) {
                    $array = (array) $target;
                    $target = end($array);
                } else {
                    return $default;
                }
                continue;
            }
            
            // Handle arrays
            if (is_array($target)) {
                if (!array_key_exists($segment, $target)) {
                    return $default;
                }
                $target = $target[$segment];
            }
            // Handle objects
            elseif (is_object($target)) {
                if (isset($target->{$segment})) {
                    $target = $target->{$segment};
                } elseif (property_exists($target, $segment)) {
                    $target = $target->{$segment};
                } else {
                    return $default;
                }
            }
            // Can't traverse further
            else {
                return $default;
            }
        }
        
        return $target;
    }

    public static function collect($items = [])
    {
        return new Collection($items);
    }
}
