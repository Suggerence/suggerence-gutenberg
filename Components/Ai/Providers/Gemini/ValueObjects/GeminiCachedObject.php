<?php

namespace SuggerenceGutenberg\Components\Ai\Providers\Gemini\ValueObjects;

use Illuminate\Support\Carbon;

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
            data_get($response, 'name', ''),
            data_get($response, 'usageMetadata.totalTokenCount', 0),
            Carbon::parse(data_get($response, 'expireTime'))
        );
    }
}
