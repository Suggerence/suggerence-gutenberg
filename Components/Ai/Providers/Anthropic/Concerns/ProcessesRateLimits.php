<?php

namespace SuggerenceGutenberg\Components\Ai\Providers\Anthropic\Concerns;

use Illuminate\Support\Arr;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;

use SuggerenceGutenberg\Components\Ai\ValueObjects\ProviderRateLimit;

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

        return array_values(Arr::map($rateLimits, function($fields, $limitName) {
            $resetsAt = data_get($fields, 'reset');

            return new ProviderRateLimit(
                $limitName,
                data_get($fields, 'limit') !== null ? (int) data_get($fields, 'limit') : null,
                data_get($fields, 'remaining') !== null ? (int) data_get($fields, 'remaining') : null,
                $resetsAt ? new Carbon($resetsAt) : null
            );
        }));
    }
}
