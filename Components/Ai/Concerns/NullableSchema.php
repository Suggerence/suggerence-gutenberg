<?php

namespace SuggerenceGutenberg\Components\Ai\Concerns;

trait NullableSchema
{
    protected function castToNullable($type)
    {
        return [$type, 'null'];
    }
}
