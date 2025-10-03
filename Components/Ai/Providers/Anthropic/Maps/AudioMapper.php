<?php

namespace SuggerenceGutenberg\Components\Ai\Providers\Anthropic\Maps;

use SuggerenceGutenberg\Components\Ai\Contracts\ProviderMediaMapper;
use SuggerenceGutenberg\Components\Ai\Enums\Provider;

class AudioMapper extends ProviderMediaMapper
{
    public function __construct(
        public $media,
        public $cacheControl = null
    ) {
        $this->runValidation();
    }

    public function toPayload()
    {
        $payload = [
            'type' => 'audio',
            'cache_control' => $this->cacheControl,
        ];

        if ($this->media->isFileId()) {
            $payload['source'] = [
                'type' => 'file',
                'file_id' => $this->media->fileId(),
            ];
        } elseif ($this->media->isUrl()) {
            $payload['source'] = [
                'type' => 'url',
                'url' => $this->media->url(),
            ];
        } else {
            $payload['source'] = [
                'type' => 'base64',
                'media_type' => $this->media->mimeType(),
                'data' => $this->media->base64(),
            ];
        }

        return array_filter($payload);
    }

    protected function provider()
    {
        return Provider::Anthropic;
    }

    protected function validateMedia()
    {
        if ($this->media->isFileId()) {
            return true;
        }

        if ($this->media->isUrl()) {
            return true;
        }

        return $this->media->hasRawContent();
    }
}

