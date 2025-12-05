<?php

namespace SuggerenceGutenberg\Components\Ai\Contracts;

use SuggerenceGutenberg\Components\Ai\Exceptions\Exception;
use SuggerenceGutenberg\Components\Ai\Enums\Provider;

abstract class ProviderMediaMapper
{
    public function __construct(public $media)
    {
        $this->runValidation();
    }

    abstract public function toPayload();

    abstract protected function provider();

    abstract protected function validateMedia();

    protected function runValidation()
    {
        if ($this->validateMedia() === false) {
            $providerName = $this->provider() instanceof Provider ? $this->provider()->value : $this->provider();

            $calledClass = static::class;

            throw new Exception("The $providerName provider does not support the mediums available in the provided `$calledClass`. Please consult the documentation for more information on which mediums the $providerName provider supports.");
        }
    }
}
