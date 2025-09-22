<?php

namespace SuggerenceGutenberg\Components\Ai\Providers\Gemini\Concerns;

use SuggerenceGutenberg\Components\Ai\Exceptions\Exception;

trait ValidatesResponse
{
    public function validateResponse($response)
    {
        $data = $response->json();

        if (!$data || data_get($data, 'error')) {
            throw Exception::providerResponseError(vsprintf(
                'Gemini Error: [%s] %s',
                [
                    data_get($data, 'error.type', 'unknown'),
                    data_get($data, 'error.message', 'unknown'),
                ]
            ));
        }
    }
}
