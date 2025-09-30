<?php

namespace SuggerenceGutenberg\Components\Ai;

use SuggerenceGutenberg\Components\Ai\Text\PendingRequest as PendingTextRequest;
use SuggerenceGutenberg\Components\Ai\Structured\PendingRequest as PendingStructuredRequest;
// use SuggerenceGutenberg\Components\Ai\Embeddings\PendingRequest as PendingEmbeddingsRequest;
use SuggerenceGutenberg\Components\Ai\Images\PendingRequest as PendingImagesRequest;
// use SuggerenceGutenberg\Components\Ai\Audio\PendingRequest as PendingAudioRequest;

class AI
{
    public static function text()
    {
        return new PendingTextRequest;
    }

    public static function structured()
    {
        return new PendingStructuredRequest;
    }

    public static function embeddings()
    {
        // return new PendingEmbeddingsRequest;
    }

    public static function images()
    {
        return new PendingImagesRequest;
    }

    public static function audio()
    {
        // return new PendingAudioRequest;
    }

    public static function provider($name, $providerConfig = [])
    {
        return Manager::resolve($name, $providerConfig);
    }

    public static function providers()
    {
        return Manager::all();
    }
}
