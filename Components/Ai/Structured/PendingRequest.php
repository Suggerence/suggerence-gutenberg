<?php

namespace SuggerenceGutenberg\Components\Ai\Structured;

use SuggerenceGutenberg\Components\Ai\Concerns\ConfiguresClient;
use SuggerenceGutenberg\Components\Ai\Concerns\ConfiguresModels;
use SuggerenceGutenberg\Components\Ai\Concerns\ConfiguresProviders;
use SuggerenceGutenberg\Components\Ai\Concerns\ConfiguresStructuredOutput;
use SuggerenceGutenberg\Components\Ai\Concerns\HasMessages;
use SuggerenceGutenberg\Components\Ai\Concerns\HasPrompts;
use SuggerenceGutenberg\Components\Ai\Concerns\HasProviderOptions;
use SuggerenceGutenberg\Components\Ai\Concerns\HasSchema;
use SuggerenceGutenberg\Components\Ai\Exceptions\Exception;
use SuggerenceGutenberg\Components\Ai\ValueObjects\Messages\UserMessage;

use Throwable;

class PendingRequest
{
    use ConfiguresClient;
    use ConfiguresModels;
    use ConfiguresProviders;
    use ConfiguresStructuredOutput;
    use HasMessages;
    use HasPrompts;
    use HasProviderOptions;
    use HasSchema;

    public function asStructured()
    {
        $request = $this->toRequest();

        try {
            return $this->provider->structured($request);
        } catch (Throwable $e) {
            $this->provider->handleRequestException($request->model(), $e);
        }
    }

    public function toRequest()
    {
        if ($this->messages && $this->prompt) {
            throw Exception::promptOrMessages();
        }

        $messages = $this->messages;

        if ($this->prompt) {
            $messages[] = new UserMessage($this->prompt, $this->additionalContent);
        }

        if (! $this->schema instanceof \SuggerenceGutenberg\Components\Ai\Contracts\Schema) {
            throw new Exception('A schema is required for structured output');
        }

        return new Request(
            systemPrompts: $this->systemPrompts,
            model: $this->model,
            providerKey: $this->providerKey(),
            prompt: $this->prompt,
            messages: $messages,
            maxTokens: $this->maxTokens,
            temperature: $this->temperature,
            topP: $this->topP,
            clientOptions: $this->clientOptions,
            clientRetry: $this->clientRetry,
            schema: $this->schema,
            mode: $this->structuredMode,
            providerOptions: $this->providerOptions,
        );
    }
}
