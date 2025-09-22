<?php

namespace SuggerenceGutenberg\Components\Ai\Concerns;

use Illuminate\Support\Facades\Http;

trait InitializesClient
{
    protected function baseClient()
    {
        return Http::withRequestMiddleware(fn ($request) => $request)
            ->withResponseMiddleware(fn ($response) => $response)
            ->throw();
    }
}
