<?php

namespace SuggerenceGutenberg\Components\Ai\Providers\OpenAI\Concerns;

use SuggerenceGutenberg\Components\Ai\Exceptions\Exception;

trait ValidatesResponse
{
    protected function validateResponse($response)
    {
        $data = $response->json();

        if (!$data || data_get($data, 'error')) {
            throw Exception::providerResponseError(vsprintf(
                'OpenAI Error: [%s] %s',
                [
                    data_get($data, 'error.type', 'unknown'),
                    data_get($data, 'error.message', 'unknown'),
                ]
            ));
        }
    }
}
