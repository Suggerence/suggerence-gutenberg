<?php

namespace SuggerenceGutenberg\Components\Ai\Providers\OpenAI\Concerns;

use SuggerenceGutenberg\Components\Ai\Providers\OpenAI\Maps\ToolMap;

trait BuildsTools
{
    protected function buildTools($request)
    {
        $tools = ToolMap::map($request->tools());

        if ($request->providerTools() === []) {
            return $tools;
        }

        $providerTools = array_map(
            fn ($tool) => [
                'type' => $tool->type,
                ...$tool->options
            ],
            $request->providerTools()
        );

        return array_merge($providerTools, $tools);
    }
}
