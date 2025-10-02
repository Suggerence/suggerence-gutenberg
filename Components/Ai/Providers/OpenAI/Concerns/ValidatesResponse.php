<?php

namespace SuggerenceGutenberg\Components\Ai\Providers\OpenAI\Concerns;

use SuggerenceGutenberg\Components\Ai\Exceptions\Exception;
use SuggerenceGutenberg\Components\Ai\Helpers\Functions;

trait ValidatesResponse
{
    protected function validateResponse($response)
    {
        $data = $response->json();

        if (!$data || Functions::data_get($data, 'error')) {
            throw Exception::providerResponseError(vsprintf(
                'OpenAI Error: [%s] %s',
                [
                    Functions::data_get($data, 'error.type', 'unknown'),
                    Functions::data_get($data, 'error.message', 'unknown'),
                ]
            ));
        }
    }
}
