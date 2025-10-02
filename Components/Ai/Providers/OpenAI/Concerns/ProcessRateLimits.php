<?php

namespace SuggerenceGutenberg\Components\Ai\Providers\OpenAI\Concerns;

use SuggerenceGutenberg\Components\Ai\Helpers\Time;
use SuggerenceGutenberg\Components\Ai\ValueObjects\ProviderRateLimit;

trait ProcessRateLimits
{
    protected function processRateLimits($response)
    {
        $headers = $response->getHeaders();
        $rateLimits = [];

        if (isset($headers['x-ratelimit-limit-requests']) && isset($headers['x-ratelimit-remaining-requests'])) {
            $rateLimits[] = new ProviderRateLimit(
                'requests',
                (int) $headers['x-ratelimit-limit-requests'][0],
                (int) $headers['x-ratelimit-remaining-requests'][0],
                $this->parseResetTime($headers['x-ratelimit-reset-requests'][0] ?? null)
            );
        }

        if (isset($headers['x-ratelimit-limit-tokens']) && isset($headers['x-ratelimit-remaining-tokens'])) {
            $rateLimits[] = new ProviderRateLimit(
                'tokens',
                (int) $headers['x-ratelimit-limit-tokens'][0],
                (int) $headers['x-ratelimit-remaining-tokens'][0],
                $this->parseResetTime($headers['x-ratelimit-reset-tokens'][0] ?? null)
            );
        }

        return $rateLimits;
    }

    protected function parseResetTime($resetTime)
    {
        if ($resetTime === null || $resetTime === '' || $resetTime === '0') {
            return null;
        }

        if (preg_match('/^(\d+)(ms|s|m|h)$/', $resetTime, $matches)) {
            $value = (int) $matches[1];
            $unit = $matches[2];

            return match ($unit) {
                'ms'    => Time::fromTimestamp(Time::now())->addSeconds($value / 1000),
                's'     => Time::fromTimestamp(Time::now())->addSeconds($value),
                'm'     => Time::fromTimestamp(Time::now())->addMinutes($value),
                'h'     => Time::fromTimestamp(Time::now())->addHours($value),
            };
        }

        return null;
    }
}
