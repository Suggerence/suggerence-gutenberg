<?php

namespace SuggerenceGutenberg\Components\Ai\Providers\Gemini\ValueObjects;

use SuggerenceGutenberg\Components\Ai\Helpers\Time;
use SuggerenceGutenberg\Components\Ai\Helpers\Functions;

class GeminiCachedObject
{
    public function __construct(
        public $id,
        public $model,
        public $tokens,
        public $expiresAt
    ) {}

    public static function fromResponse($model, $response)
    {
        return new self(
            $model,
            Functions::data_get($response, 'name', ''),
            Functions::data_get($response, 'usageMetadata.totalTokenCount', 0),
            Time::fromString(Functions::data_get($response, 'expireTime'))
        );
    }
}
