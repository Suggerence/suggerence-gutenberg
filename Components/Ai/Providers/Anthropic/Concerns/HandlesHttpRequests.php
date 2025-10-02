<?php

namespace SuggerenceGutenberg\Components\Ai\Providers\Anthropic\Concerns;

use SuggerenceGutenberg\Components\Ai\Exceptions\Exception;
use SuggerenceGutenberg\Components\Ai\Helpers\Functions;

trait HandlesHttpRequests
{
    abstract public static function buildHttpRequestPayload($request);

    protected function sendRequest()
    {
        // error_log(print_r(static::buildHttpRequestPayload($this->request), true));

        $this->httpResponse = $this->client->post(
            'messages',
            static::buildHttpRequestPayload($this->request)
        );

        $this->handleResponseErrors();
    }

    protected function handleResponseErrors()
    {
        $data = $this->httpResponse->json();

        if (Functions::data_get($data, 'type') === 'error') {
            throw Exception::providerResponseError(vsprintf(
                'Anthropic Error: [%s] %s',
                [
                    Functions::data_get($data, 'error.type', 'unknown'),
                    Functions::data_get($data, 'error.message'),
                ]
            ));
        }
    }
}
