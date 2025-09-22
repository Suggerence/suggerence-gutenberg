<?php

namespace SuggerenceGutenberg\Components\Ai\Exceptions;

class RequestTooLargeException extends Exception
{
    public function __construct($provider)
    {
        $provider = is_string($provider) ? $provider : $provider->value;

        parent::__construct("Your request to $provider was too large. Consult the provider's documentation.");
    }

    public static function make($provider)
    {
        return new self($provider);
    }
}
