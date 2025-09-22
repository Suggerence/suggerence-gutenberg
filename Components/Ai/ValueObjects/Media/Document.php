<?php

namespace SuggerenceGutenberg\Components\Ai\ValueObjects\Media;

class Document extends Media
{
    protected $documentTitle = null;

    protected $chunks = null;

    public static function fromFileId($fileId, $title = null)
    {
        return parent::fromFileId($fileId)->setDocumentTitle($title);
    }

    public static function fromPath($path, $title = null)
    {
        return self::fromLocalPath($path, $title);
    }

    public static function fromLocalPath($path, $title = null)
    {
        return parent::fromLocalPath($path)->setDocumentTitle($title);
    }

    public static function fromStoragePath($path, $diskName, $title = null)
    {
        return parent::fromStoragePath($path, $diskName)->setDocumentTitle($title);
    }

    public static function fromUrl($url, $title = null)
    {
        return parent::fromUrl($url)->setDocumentTitle($title);
    }

    public static function fromRawContent($rawContent, $mimeType = null, $title = null)
    {
        return parent::fromRawContent($rawContent, $mimeType)->setDocumentTitle($title);
    }

    public static function fromBase64($document, $mimeType = null, $title = null)
    {
        return parent::fromBase64($document, $mimeType)->setDocumentTitle($title);
    }

    public static function fromText($text, $title = null)
    {
        return parent::fromRawContent($text, 'text/plain', $title);
    }

    public static function fromChunks($chunks, $title = null)
    {
        $document = new self;
        $document->chunks = $chunks;
        $document->documentTitle = $title;

        return $document;
    }

    public function isChunks()
    {
        return $this->chunks !== null;
    }

    public function setDocumentTitle($title)
    {
        $this->documentTitle = $title;

        return $this;
    }

    public function documentTitle()
    {
        return $this->documentTitle;
    }

    public function chunks()
    {
        return $this->chunks;
    }
}
