<?php

namespace SuggerenceGutenberg\Components\Ai\Providers\Gemini\Maps;

use SuggerenceGutenberg\Components\Ai\Contracts\ProviderMediaMapper;
use SuggerenceGutenberg\Components\Ai\Enums\Provider;

class ImageMapper extends ProviderMediaMapper
{
    public function toPayload()
    {
        return [
            'inline_data' => [
                'mime_type' => $this->media->mimeType(),
                'data'      => $this->media->base64()
            ]
        ];
    }

    protected function provider()
    {
        return Provider::Gemini;
    }

    protected function validateMedia()
    {
        if ($this->media->isUrl()) {
            return true;
        }

        return $this->media->hasRawContent();
    }
}
