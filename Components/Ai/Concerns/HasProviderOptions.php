<?php

namespace SuggerenceGutenberg\Components\Ai\Concerns;

use SuggerenceGutenberg\Components\Ai\Helpers\Functions;

trait HasProviderOptions
{
    protected $providerOptions;

    public function withProviderOptions($options = [])
    {
        $this->providerOptions = $options;

        return $this;
    }

    public function providerOptions($valuePath = null)
    {
        if ($valuePath === null) {
            return $this->providerOptions;
        }

        return Functions::data_get($this->providerOptions, $valuePath, null);
    }
}
