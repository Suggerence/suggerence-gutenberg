<?php

namespace SuggerenceGutenberg\Components\Ai\Providers\OpenAI\Maps;

use SuggerenceGutenberg\Components\Ai\Contracts\ProviderMediaMapper;
use SuggerenceGutenberg\Components\Ai\Enums\Provider;

class DocumentMapper extends ProviderMediaMapper
{
    public function toPayload()
    {
        $payload = [
            'type' => 'input_file'
        ];

        if ($this->media->isFileId()) {
            $payload['file_id'] = $this->media->fileId();
        }
        elseif ($this->media->isUrl()) {
            $payload['file_url'] = $this->media->url();
        }
        else {
            $payload['filename']    = $this->media->documentTitle() ?? 'document';
            $payload['file_data']   = sprintf('data:%s;base64,%s', $this->media->mimeType(), $this->media->base64());
        }

        return array_filter($payload);
    }

    protected function provider()
    {
        return Provider::OpenAI;
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
