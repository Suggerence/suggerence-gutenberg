<?php

namespace SuggerenceGutenberg\Components\Ai\Exceptions;

class RateLimitedException extends Exception
{
    public function __construct(
        $rateLimits,
        $retryAfter = null
    ) {
        $message = 'You hit a provider rate limit';

        if ($retryAfter) {
            $message .= ' - retry after ' . $retryAfter . ' seconds';
        }

        $message .= '. Details: ' . json_encode( $rateLimits );

        parent::__construct($message);
    }

    public static function make($rateLimits = [], $retryAfter = null)
    {
        return new self($rateLimits, $retryAfter);
    }
}
