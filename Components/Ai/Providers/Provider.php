<?php

namespace SuggerenceGutenberg\Components\Ai\Providers;

use SuggerenceGutenberg\Components\Ai\Exceptions\Exception;
use SuggerenceGutenberg\Components\Ai\Helpers\Functions;
use SuggerenceGutenberg\Components\Ai\Exceptions\ProviderOverloadedException;
use SuggerenceGutenberg\Components\Ai\Exceptions\RateLimitedException;
use SuggerenceGutenberg\Components\Ai\Exceptions\RequestTooLargeException;

abstract class Provider
{
    public function text($request)
    {
        throw Exception::unsupportedProviderAction('text', Functions::class_basename($this));
    }

    public function structured($request)
    {
        throw Exception::unsupportedProviderAction('structured', Functions::class_basename($this));
    }

    public function embeddings($request)
    {
        throw Exception::unsupportedProviderAction('embeddings', Functions::class_basename($this));
    }

    public function images($request)
    {
        throw Exception::unsupportedProviderAction('images', Functions::class_basename($this));
    }

    public function textToSpeech($request)
    {
        throw Exception::unsupportedProviderAction('textToSpeech', Functions::class_basename($this));
    }

    public function speechToText($request)
    {
        throw Exception::unsupportedProviderAction('speechToText', Functions::class_basename($this));
    }

    public function stream($request)
    {
        throw Exception::unsupportedProviderAction(__METHOD__, Functions::class_basename($this));
    }

    public function models()
    {
        throw Exception::unsupportedProviderAction(__METHOD__, Functions::class_basename($this));
    }

    public function handleRequestException($model, $e)
    {
        match ($e->response->getStatusCode()) {
            413     => throw RequestTooLargeException::make(Functions::class_basename($this)),
            429     => throw RateLimitedException::make([]),
            529     => throw ProviderOverloadedException::make(Functions::class_basename($this)),
            default => throw Exception::providerRequestError($model, $e),
        };
    }

    public function info()
    {
        return [
            'id'            => Functions::class_basename($this),
            'name'          => ucfirst(Functions::class_basename($this)),
            'description'   => 'Description of the provider',
            'website'       => 'https://www.provider.com',
            'configured'    => false,
            'models'        => $this->models()
        ];
    }
}
