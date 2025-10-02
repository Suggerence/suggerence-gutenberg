<?php

namespace SuggerenceGutenberg\Components\Ai\ValueObjects\Media;

use finfo;
use SuggerenceGutenberg\Components\Ai\Helpers\WPClient;
use SuggerenceGutenberg\Components\Ai\Concerns\HasProviderOptions;

use InvalidArgumentException;

class Media
{
    use HasProviderOptions;

    protected $fileId = null;
    
    protected $localPath = null;

    protected $storagePath = null;

    protected $url = null;

    protected $rawContent = null;

    protected $base64 = null;

    protected $mimeType = null;

    final public function __construct() {}

    public static function fromFileId($fileId)
    {
        $instance = new static;
        $instance->fileId = $fileId;

        return $instance;
    }

    public static function fromPath($path)
    {
        return self::fromLocalPath($path);
    }

    public static function fromLocalPath($path)
    {
        if (!is_file($path)) {
            throw new InvalidArgumentException("$path is not a file");
        }

        $content = file_get_contents($path) ?: '';

        if (in_array(trim($content), ['', '0'], true)) {
            throw new InvalidArgumentException("$path is empty");
        }

        $mimeType = mime_content_type($path);

        if ($mimeType === false) {
            throw new InvalidArgumentException("Could not determine mime type for $path");
        }

        $instance = new static;

        $instance->localPath    = $path;
        $instance->rawContent   = $content;
        $instance->mimeType     = $mimeType;

        return $instance;
    }

    public static function fromStoragePath($path, $diskName = null)
    {
        // Convert to absolute path if it's not already
        if (!is_file($path)) {
            throw new InvalidArgumentException("$path does not exist");
        }

        $content = file_get_contents($path);

        if ($content === false || in_array(trim($content), ['', '0'], true)) {
            throw new InvalidArgumentException("$path is empty");
        }

        $mimeType = mime_content_type($path);

        if ($mimeType === false) {
            throw new InvalidArgumentException("Could not determine mime type for {$path}");
        }

        $instance = new static;

        $instance->storagePath = $path;
        $instance->rawContent = $content;
        $instance->mimeType = $mimeType;

        return $instance;
    }

    public static function fromUrl($url)
    {
        $instance = new static;
        $instance->url = $url;

        return $instance;
    }

    public static function fromRawContent($rawContent, $mimeType = null)
    {
        $instance = new static;

        $instance->rawContent = $rawContent;
        $instance->mimeType = $mimeType;

        return $instance;
    }

    public static function fromBase64($base64, $mimeType = null)
    {
        $instance = new static;

        $instance->base64 = $base64;
        $instance->mimeType = $mimeType;

        return $instance;
    }

    public function isFileId()
    {
        return $this->fileId !== null;
    }

    public function isFile()
    {
        return $this->localPath !== null || $this->storagePath !== null;
    }

    public function isUrl()
    {
        return $this->url !== null;
    }

    public function hasBase64()
    {
        return $this->hasRawContent();
    }

    public function hasRawContent()
    {
        if ($this->base64 !== null) {
            return true;
        }

        if ($this->rawContent !== null) {
            return true;
        }

        if ($this->isFile()) {
            return true;
        }

        return $this->isUrl();
    }

    public function fileId()
    {
        return $this->fileId;
    }

    public function localPath()
    {
        return $this->localPath;
    }

    public function storagePath()
    {
        return $this->storagePath;
    }

    public function url()
    {
        return $this->url;
    }
    
    public function rawContent()
    {
        if ($this->rawContent) {
            return $this->rawContent;
        }

        if ($this->localPath) {
            $this->rawContent = file_get_contents($this->localPath) ?: null;
        }
        elseif ($this->storagePath) {
            $this->rawContent = file_get_contents($this->storagePath) ?: null;
        }
        elseif ($this->isUrl()) {
            $this->fetchUrlContent();
        }
        elseif ($this->hasBase64()) {
            $this->rawContent = base64_decode((string) $this->base64);
        }

        return $this->rawContent;
    }
    
    public function base64()
    {
        if ($this->base64) {
            return $this->base64;
        }

        return $this->base64 = base64_encode((string) $this->rawContent());
    }

    public function mimeType()
    {
        if ($this->mimeType) {
            return $this->mimeType;
        }

        if ($content = $this->rawContent()) {
            $this->mimeType = (new finfo(FILEINFO_MIME_TYPE))->buffer($content) ?: null;
        }

        return $this->mimeType;
    }

    public function resource()
    {
        if ($this->localPath) {
            $resource = fopen($this->localPath, 'r');
            if ($resource === false) {
                throw new InvalidArgumentException("Cannot open file: {$this->localPath}");
            }

            return $resource;
        }

        if ($this->url) {
            $this->fetchUrlContent();

            return $this->createStreamFromContent($this->rawContent());
        }

        if ($this->rawContent || $this->base64) {
            return $this->createStreamFromContent($this->rawContent());
        }

        throw new InvalidArgumentException('Cannot create resource from media');
    }

    public function fetchUrlContent()
    {
        if (!$this->url) {
            return;
        }

        $content = (new WPClient())->get($this->url)->body();

        if (in_array(trim($content), ['', '0'], true)) {
            throw new InvalidArgumentException("{$this->url} returns no content.");
        }

        $mimeType = (new finfo(FILEINFO_MIME_TYPE))->buffer($content);

        if ($mimeType === false) {
            throw new InvalidArgumentException("Could not determine mime type for {$this->url}.");
        }

        $this->rawContent = $content;
    }

    protected function createStreamFromContent($content)
    {
        if ($content === null) {
            throw new InvalidArgumentException('Cannot create stream from null content');
        }

        $stream = fopen('php://temp', 'r+');
        if ($stream === false) {
            throw new InvalidArgumentException('Cannot create temporary stream');
        }

        fwrite($stream, $content);
        rewind($stream);

        return $stream;
    }
}
