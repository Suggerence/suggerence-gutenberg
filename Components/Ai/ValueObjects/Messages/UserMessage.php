<?php

namespace SuggerenceGutenberg\Components\Ai\ValueObjects\Messages;

use SuggerenceGutenberg\Components\Ai\Concerns\HasProviderOptions;
use SuggerenceGutenberg\Components\Ai\Contracts\Message;
use SuggerenceGutenberg\Components\Ai\ValueObjects\Media\Audio;
use SuggerenceGutenberg\Components\Ai\ValueObjects\Media\Document;
use SuggerenceGutenberg\Components\Ai\ValueObjects\Media\Image;
use SuggerenceGutenberg\Components\Ai\ValueObjects\Media\Media;
use SuggerenceGutenberg\Components\Ai\ValueObjects\Media\Text;
use SuggerenceGutenberg\Components\Ai\ValueObjects\Media\Video;

class UserMessage implements Message
{
    use HasProviderOptions;

    public function __construct(
        public $content,
        public $additionalContent = [],
        public $additionalAttributes = []
    ) {
        $this->additionalContent[] = new Text($content);
    }

    public function text()
    {
        $result = '';

        foreach ($this->additionalContent as $content) {
            if ($content instanceof Text) {
                $result .= $content->text;
            }
        }

        return $result;
    }

    public function images()
    {
        return collect($this->additionalContent)
            ->where(fn($part) => $part instanceof Image)
            ->toArray();
    }

    public function media()
    {
        return collect($this->additionalContent)
            ->filter(fn($part) => $part instanceof Audio || $part instanceof Video || $part instanceof Media)
            ->toArray();
    }

    public function documents()
    {
        return collect($this->additionalContent)
            ->where(fn($part) => $part instanceof Document)
            ->toArray();
    }

    public function audios()
    {
        return collect($this->additionalContent)
            ->where(fn($part) => $part instanceof Audio)
            ->toArray();
    }
}
