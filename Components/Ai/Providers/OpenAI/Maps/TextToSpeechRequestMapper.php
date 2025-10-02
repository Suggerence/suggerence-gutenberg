<?php

namespace SuggerenceGutenberg\Components\Ai\Providers\OpenAI\Maps;

use SuggerenceGutenberg\Components\Ai\Contracts\ProviderRequestMapper;
use SuggerenceGutenberg\Components\Ai\Enums\Provider;
use SuggerenceGutenberg\Components\Ai\Helpers\Functions;

class TextToSpeechRequestMapper extends ProviderRequestMapper
{
    public function __construct(
        public $request
    ) {}
    
    public function toPayload()
    {
        $providerOptions = $this->request->providerOptions();

        $baseData = [
            'model' => $this->request->model(),
            'input' => $this->request->input(),
            'voice' => $this->request->voice()
        ];

        $supportedOptions = [
            'response_format'   => $providerOptions['response_format'] ?? null,
            'speed'             => $providerOptions['speed'] ?? null
        ];

        return array_merge(
            $baseData,
            Functions::where_not_null($supportedOptions),
            array_diff_key($providerOptions, $supportedOptions)
        );
    }

    protected function provider()
    {
        return Provider::OpenAI;
    }
}
