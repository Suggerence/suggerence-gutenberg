<?php

namespace SuggerenceGutenberg\Components\Ai\Providers;

use function SuggerenceGutenberg\Components\Ai\Helpers\class_basename;
use SuggerenceGutenberg\Components\Ai\Exceptions\Exception;
use SuggerenceGutenberg\Components\Ai\Exceptions\ProviderOverloadedException;
use SuggerenceGutenberg\Components\Ai\Exceptions\RateLimitedException;
use SuggerenceGutenberg\Components\Ai\Exceptions\RequestTooLargeException;

abstract class Provider
{
    public function text($request)
    {
        throw Exception::unsupportedProviderAction('text', class_basename($this));
    }

    public function structured($request)
    {
        throw Exception::unsupportedProviderAction('structured', class_basename($this));
    }

    public function embeddings($request)
    {
        throw Exception::unsupportedProviderAction('embeddings', class_basename($this));
    }

    public function images($request)
    {
        throw Exception::unsupportedProviderAction('images', class_basename($this));
    }

    public function textToSpeech($request)
    {
        throw Exception::unsupportedProviderAction('textToSpeech', class_basename($this));
    }

    public function speechToText($request)
    {
        throw Exception::unsupportedProviderAction('speechToText', class_basename($this));
    }

    public function stream($request)
    {
        throw Exception::unsupportedProviderAction(__METHOD__, class_basename($this));
    }

    public function models()
    {
        throw Exception::unsupportedProviderAction(__METHOD__, class_basename($this));
    }

    public function handleRequestException($model, $e)
    {
        match ($e->response->getStatusCode()) {
            413     => throw RequestTooLargeException::make(class_basename($this)),
            429     => throw RateLimitedException::make([]),
            529     => throw ProviderOverloadedException::make(class_basename($this)),
            default => throw Exception::providerRequestError($model, $e),
        };
    }

    public function info()
    {
        return [
            'id'            => class_basename($this),
            'name'          => ucfirst(class_basename($this)),
            'description'   => 'Description of the provider',
            'website'       => 'https://www.provider.com',
            'configured'    => false,
            'models'        => $this->models()
        ];
    }
}
