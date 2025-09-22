<?php

namespace SuggerenceGutenberg\Components\Ai\Helpers;

function class_basename($class)
{
    $reflection = new \ReflectionClass($class);
    return $reflection->getShortName();
}
