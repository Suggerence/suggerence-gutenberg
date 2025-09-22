<?php

namespace SuggerenceGutenberg\Components\Ai\Concerns;

trait ConfiguresClient
{
    protected $clientOptions = [];

    protected $clientRetry = [0];

    public function withClientOptions($options)
    {
        $this->clientOptions = $options;

        return $this;
    }

    public function withClientRetry($times, $sleepMilliseconds = 0, $when = null, $throw = true)
    {
        $this->clientRetry = [
            $times,
            $sleepMilliseconds,
            $when,
            $throw
        ];

        return $this;
    }
}
