<?php

namespace SuggerenceGutenberg\Components\Ai\Providers\OpenAI\Maps;

use Illuminate\Support\Arr;

class ImageRequestMap
{
    public static function map($request)
    {
        $baseData = [
            'model'     => $request->model(),
            'prompt'    => $request->prompt(),
        ];

        $providerOptions = $request->providerOptions();

        $supportedOptions = [
            // Common parameters
            'n'                     => $providerOptions['n'] ?? null,
            'size'                  => $providerOptions['size'] ?? null,
            'response_format'       => $providerOptions['response_format'] ?? null,
            'user'                  => $providerOptions['user'] ?? null,

            // DALLE parameters
            'quality'               => $providerOptions['quality'] ?? null,
            'style'                 => $providerOptions['style'] ?? null,

            // GPT-Image-1 parameters
            'background'            => $providerOptions['background'] ?? null,
            'moderation'            => $providerOptions['moderation'] ?? null,
            'output_compression'    => $providerOptions['output_compression'] ?? null,
            'output_format'         => $providerOptions['output_format'] ?? null
        ];

        unset($providerOptions['image']);
        unset($providerOptions['mask']);

        $additionalOptions = array_diff_key($providerOptions, $supportedOptions);

        return array_merge($baseData, Arr::whereNotNull($supportedOptions), $additionalOptions);
    }
}
