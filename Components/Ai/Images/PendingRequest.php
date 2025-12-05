<?php

namespace SuggerenceGutenberg\Components\Ai\Images;

use SuggerenceGutenberg\Components\Ai\Concerns\ConfiguresClient;
use SuggerenceGutenberg\Components\Ai\Concerns\ConfiguresGeneration;
use SuggerenceGutenberg\Components\Ai\Concerns\ConfiguresModels;
use SuggerenceGutenberg\Components\Ai\Concerns\ConfiguresProviders;
use SuggerenceGutenberg\Components\Ai\Concerns\ConfiguresTools;
use SuggerenceGutenberg\Components\Ai\Concerns\HasPrompts;
use SuggerenceGutenberg\Components\Ai\Concerns\HasProviderOptions;
use SuggerenceGutenberg\Components\Ai\Concerns\HasProviderTools;
use SuggerenceGutenberg\Components\Ai\Concerns\HasTools;

use Throwable;
class PendingRequest
{
    use ConfiguresClient;
    use ConfiguresGeneration;
    use ConfiguresModels;
    use ConfiguresProviders;
    use ConfiguresTools;
    use HasPrompts;
    use HasProviderOptions;
    use HasProviderTools;
    use HasTools;

    public function asImages()
    {
        $request = $this->toRequest();

        try {
            return $this->provider->images($request);
        } catch (Throwable $e) {
            $this->provider->handleRequestException($request->model(), $e);
        }
    }

    public function toRequest()
    {
        return new Request(
            $this->model,
            $this->provider,
            $this->prompt,
            $this->tools,
            $this->providerOptions,
            $this->providerTools,
            $this->clientOptions ?? [],
            $this->clientRetry ?? 3
        );
    }
}
