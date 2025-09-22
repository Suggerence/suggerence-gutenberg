<?php

namespace SuggerenceGutenberg\Components\Ai\Providers\Gemini\Maps;

use Illuminate\Support\Arr;
use InvalidArgumentException;

class ImageRequestMap
{
    public static function map($request)
    {
        return match (str_contains($request->model(), 'gemini')) {
            true    => self::geminiOptions($request),
            false   => self::imagenOptions($request)
        };
    }

    protected static function geminiOptions($request)
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

    protected static function imagenOptions($request)
    {
        $providerOptions = $request->providerOptions();

        $options = [
            'instances' => ['prompt' => $request->prompt()]
        ];

        $parameters = Arr::whereNotNull([
            'sampleCount'       => $providerOptions['n'] ?? null,
            'sampleImageSize'   => $providerOptions['size'] ?? null,
            'aspectRatio'       => $providerOptions['aspect_ratio'] ?? null,
            'personGeneration'  => $providerOptions['person_generation'] ?? null
        ]);

        if (!empty($parameters)) {
            $options['parameters'] = $parameters;
        }

        return $options;
    }
}
