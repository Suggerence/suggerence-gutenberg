<?php

namespace SuggerenceGutenberg\Components\Ai\Concerns;

trait HasProviderTools
{
    protected $providerTools = [];

    public function withProviderTools($providerTools)
    {
        $this->providerTools = $providerTools;

        return $this;
    }
}
