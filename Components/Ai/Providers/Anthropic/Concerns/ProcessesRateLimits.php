<?php

namespace SuggerenceGutenberg\Components\Ai\Providers\Anthropic\Concerns;

use SuggerenceGutenberg\Components\Ai\Helpers\Str;
use SuggerenceGutenberg\Components\Ai\Helpers\Time;
use SuggerenceGutenberg\Components\Ai\ValueObjects\ProviderRateLimit;
use SuggerenceGutenberg\Components\Ai\Helpers\Functions;

trait ProcessesRateLimits
{
    protected function processRateLimits($response)
    {
        $rateLimits = [];

        foreach ($response->getHeaders() as $headerName => $headerValues) {
            if (Str::startsWith($headerName, 'anthropic-ratelimit-') === false) {
                continue;
            }

            $limitName = Str::of($headerName)->after('anthropic-ratelimit-')->beforeLast('-')->toString();
            $fieldName = Str::of($headerName)->afterLast('-')->toString();
            
            $rateLimits[$limitName][$fieldName] = $headerValues[0];
        }

        return array_values(Functions::arr_map($rateLimits, function($fields, $limitName) {
            $resetsAt = Functions::data_get($fields, 'reset');

            return new ProviderRateLimit(
                $limitName,
                Functions::data_get($fields, 'limit') !== null ? (int) Functions::data_get($fields, 'limit') : null,
                Functions::data_get($fields, 'remaining') !== null ? (int) Functions::data_get($fields, 'remaining') : null,
                $resetsAt ? Time::fromString($resetsAt) : null
            );
        }));
    }
}
