<?php

namespace SuggerenceGutenberg\Components\Ai\Text;

use SuggerenceGutenberg\Components\Ai\Concerns\ConfiguresClient;
use SuggerenceGutenberg\Components\Ai\Concerns\ConfiguresGeneration;
use SuggerenceGutenberg\Components\Ai\Concerns\ConfiguresModels;
use SuggerenceGutenberg\Components\Ai\Concerns\ConfiguresProviders;
use SuggerenceGutenberg\Components\Ai\Concerns\ConfiguresTools;
use SuggerenceGutenberg\Components\Ai\Concerns\HasMessages;
use SuggerenceGutenberg\Components\Ai\Concerns\HasPrompts;
use SuggerenceGutenberg\Components\Ai\Concerns\HasProviderOptions;
use SuggerenceGutenberg\Components\Ai\Concerns\HasProviderTools;
use SuggerenceGutenberg\Components\Ai\Concerns\HasTools;
use SuggerenceGutenberg\Components\Ai\Exceptions\Exception;
use SuggerenceGutenberg\Components\Ai\ValueObjects\Messages\UserMessage;

use Throwable;

class PendingRequest
{
    use ConfiguresClient;
    use ConfiguresGeneration;
    use ConfiguresModels;
    use ConfiguresProviders;
    use ConfiguresTools;
    use HasMessages;
    use HasPrompts;
    use HasProviderOptions;
    use HasProviderTools;
    use HasTools;

    public function asText()
    {
        $request = $this->toRequest();

        try {
            return $this->provider->text( $request );
        } catch ( Throwable $e ) {
            $this->provider->handleRequestException( $request->model(), $e );
        }
    }

    public function asStream()
    {
        $request = $this->toRequest();

        try {
            $chunks = $this->provider->stream( $request );

            foreach( $chunks as $chunk ) {
                yield $chunk;
            }
        } catch ( Throwable $e ) {
            $this->provider->handleRequestException( $request->model(), $e );
        }
    }

    public function toRequest()
    {
        if ($this->messages && $this->prompt) {
            throw Exception::promptOrMessages();
        }

        $messages = $this->messages;

        if ($this->prompt) {
            $messages[] = new UserMessage( $this->prompt, $this->additionalContent );
        }

        return new Request(
            $this->model,
            $this->providerKey(),
            $this->systemPrompts,
            $this->prompt,
            $messages,
            $this->maxSteps,
            $this->maxTokens,
            $this->temperature,
            $this->topP,
            $this->tools,
            $this->clientOptions,
            $this->clientRetry,
            $this->toolChoice,
            $this->providerOptions,
            $this->providerTools
        );
    }
}
