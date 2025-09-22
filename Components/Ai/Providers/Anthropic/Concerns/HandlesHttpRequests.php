<?php

namespace SuggerenceGutenberg\Components\Ai\Providers\Anthropic\Concerns;

use SuggerenceGutenberg\Components\Ai\Exceptions\Exception;

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

        if (data_get($data, 'type') === 'error') {
            throw Exception::providerResponseError(vsprintf(
                'Anthropic Error: [%s] %s',
                [
                    data_get($data, 'error.type', 'unknown'),
                    data_get($data, 'error.message'),
                ]
            ));
        }
    }
}
