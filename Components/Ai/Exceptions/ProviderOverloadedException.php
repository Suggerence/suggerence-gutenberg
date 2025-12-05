<?php

namespace SuggerenceGutenberg\Components\Ai\Exceptions;

class ProviderOverloadedException extends Exception
{
    public function __construct($provider)
    {
        $provider = is_string($provider) ? $provider : $provider->value;

        parent::__construct("Provider $provider is overloaded.");
    }

    public static function make($provider)
    {
        return new self($provider);
    }
}
