<?php

namespace SuggerenceGutenberg\Components\Ai\Providers\Anthropic\Maps;

use SuggerenceGutenberg\Components\Ai\Contracts\ProviderMediaMapper;
use SuggerenceGutenberg\Components\Ai\Enums\Provider;
use SuggerenceGutenberg\Components\Ai\Helpers\Str;
use SuggerenceGutenberg\Components\Ai\Helpers\Functions;

class DocumentMapper extends ProviderMediaMapper
{
    public function __construct(
        public $media,
        public $cacheControl = null,
        public $requestProviderOptions = [],
    ) {
        $this->runValidation();
    }

    public function toPayload()
    {
        $providerOptions = $this->media->providerOptions();

        $payload = [
            'type' => 'document',
            'title' => $this->media->documentTitle(),
            'context' => $providerOptions['context'] ?? null,
            'cache_control' => $this->cacheControl,
            'citations' => Functions::data_get($this->requestProviderOptions, 'citations', Functions::data_get($providerOptions, 'citations', false))
                ? ['enabled' => true]
                : null,
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
        } elseif ($this->media->isChunks()) {
            $payload['source'] = [
                'type' => 'content',
                'content' => array_map(fn(string $chunk): array => ['type' => 'text', 'text' => $chunk], $this->media->chunks() ?? []),
            ];
        } elseif ($this->media->mimeType() && Str::startsWith($this->media->mimeType(), 'text/')) {
            $payload['source'] = [
                'type' => 'text',
                'media_type' => $this->media->mimeType(),
                'data' => $this->media->rawContent(),
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

        if ($this->media->isChunks()) {
            return true;
        }

        return $this->media->hasRawContent();
    }
}
