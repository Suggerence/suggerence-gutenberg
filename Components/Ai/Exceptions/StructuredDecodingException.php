<?php

namespace SuggerenceGutenberg\Components\Ai\Exceptions;

class StructuredDecodingException extends Exception
{
    public function __construct($responseText)
    {
        parent::__construct(sprintf(
            'Structured object could not be decoded. Received: %s',
            $responseText
        ));
    }

    public static function make($responseText)
    {
        return new self($responseText);
    }
}
