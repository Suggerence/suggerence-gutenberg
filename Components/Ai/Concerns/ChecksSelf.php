<?php

namespace SuggerenceGutenberg\Components\Ai\Concerns;

trait ChecksSelf
{
    public function is($classString)
    {
        return $this instanceof $classString;
    }
}
