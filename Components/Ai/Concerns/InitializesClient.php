<?php

namespace SuggerenceGutenberg\Components\Ai\Concerns;

use SuggerenceGutenberg\Components\Ai\Helpers\WPClient;

trait InitializesClient
{
    protected function baseClient()
    {
        return (new WPClient())
            ->withRequestMiddleware(fn ($request) => $request)
            ->withResponseMiddleware(fn ($response) => $response)
            ->throw();
    }
}
