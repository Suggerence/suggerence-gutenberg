<?php

namespace SuggerenceGutenberg\Components\Ai\Contracts;

abstract class ProviderRequestMapper
{
    abstract public function toPayload();

    abstract protected function provider();
}
