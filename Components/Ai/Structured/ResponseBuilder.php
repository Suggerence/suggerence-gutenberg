<?php

namespace SuggerenceGutenberg\Components\Ai\Structured;

use Illuminate\Support\Collection;
use SuggerenceGutenberg\Components\Ai\Enums\FinishReason;
use SuggerenceGutenberg\Components\Ai\Exceptions\StructuredDecodingException;
use SuggerenceGutenberg\Components\Ai\ValueObjects\Usage;

class ResponseBuilder
{
    public $steps;

    public function __construct()
    {
        $this->steps = new Collection;
    }

    public function addStep($step)
    {
        $this->steps->push($step);

        return $this;
    }

    public function toResponse()
    {
        $finalStep = $this->steps->last();

        return new Response(
            steps: $this->steps,
            text: $finalStep->text,
            structured: $finalStep->structured === [] && $finalStep->finishReason === FinishReason::Stop
                ? $this->decodeObject($finalStep->text)
                : $finalStep->structured,
            finishReason: $finalStep->finishReason,
            usage: $this->calculateTotalUsage(),
            meta: $finalStep->meta,
            additionalContent: $finalStep->additionalContent,
        );
    }

    protected function decodeObject($responseText)
    {
        try {
            return json_decode($responseText, true, flags: JSON_THROW_ON_ERROR);
        } catch (\JsonException) {
            throw StructuredDecodingException::make($responseText);
        }
    }

    protected function calculateTotalUsage()
    {
        return new Usage(
            promptTokens: $this
                ->steps
                ->sum(fn($result) => $result->usage->promptTokens),
            completionTokens: $this
                ->steps
                ->sum(fn($result) => $result->usage->completionTokens),
            cacheWriteInputTokens: $this->steps->contains(fn($result) => $result->usage->cacheWriteInputTokens !== null)
                ? $this->steps->sum(fn($result) => $result->usage->cacheWriteInputTokens ?? 0)
                : null,
            cacheReadInputTokens: $this->steps->contains(fn($result) => $result->usage->cacheReadInputTokens !== null)
                ? $this->steps->sum(fn($result) => $result->usage->cacheReadInputTokens ?? 0)
                : null,
            thoughtTokens: $this->steps->contains(fn($result) => $result->usage->thoughtTokens !== null)
                ? $this->steps->sum(fn($result) => $result->usage->thoughtTokens ?? 0)
                : null,
        );
    }
}
