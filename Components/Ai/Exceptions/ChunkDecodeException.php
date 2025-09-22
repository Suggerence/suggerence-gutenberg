<?php

namespace SuggerenceGutenberg\Components\Ai\Exceptions;

class ChunkDecodeException extends Exception
{
    public function __construct($provider, $previous)
    {
        parent::__construct(
            sprintf('Could not decode stream chunk from %s', $provider),
            $previous
        );
    }
}
