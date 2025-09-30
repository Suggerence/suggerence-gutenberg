<?php

namespace SuggerenceGutenberg\Components\Ai\Providers\Suggerence\Maps;

use Illuminate\Support\Arr;
use InvalidArgumentException;

class ImageRequestMap
{
    public static function map($request)
    {
        // Suggerence provider always uses Gemini-style options since it proxies to Gemini
        return self::suggerenceOptions($request);
    }

    protected static function suggerenceOptions($request)
    {
        $providerOptions = $request->providerOptions();

        $parts = [
            ['text' => $request->prompt()]
        ];

        if (isset($providerOptions['image'])) {
            $resource       = $providerOptions['image'];
            $imageContent   = is_resource($resource) ? stream_get_contents($resource) : false;
            if (!$imageContent) {
                throw new InvalidArgumentException('Image must be a valid resource.');
            }

            $parts[] = [
                'inline_data' => Arr::whereNotNull([
                    'mime_type' => $providerOptions['image_mime_type'] ?? null,
                    'data'      => base64_encode($imageContent)
                ])
            ];
        }

        return [
            'contents'  => [
                ['parts' => $parts]
            ],
            'generationConfig' => [
                'responseModalities' => ['TEXT', 'IMAGE']
            ]
        ];
    }
}
