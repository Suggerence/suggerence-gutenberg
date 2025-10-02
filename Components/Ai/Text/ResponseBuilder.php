<?php

namespace SuggerenceGutenberg\Components\Ai\Text;

use SuggerenceGutenberg\Components\Ai\Helpers\Collection;
use SuggerenceGutenberg\Components\Ai\ValueObjects\Usage;
use SuggerenceGutenberg\Components\Ai\Helpers\Functions;

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
            $this->steps,
            $finalStep->text,
            $finalStep->finishReason,
            $finalStep->toolCalls,
            $finalStep->toolResults,
            $this->calculateTotalUsage(),
            $finalStep->meta,
            Functions::collect($finalStep->messages),
            $finalStep->additionalContent
        );
    }

    protected function calculateTotalUsage()
    {
        return new Usage(
            $this->steps->sum(fn ($result) => $result->usage->promptTokens),
            $this->steps->sum(fn ($result) => $result->usage->completionTokens),
            $this->steps->contains(fn ($result) => $result->usage->cacheWriteInputTokens !== null)
                ? $this->steps->sum(fn ($result) => $result->usage->cacheWriteInputTokens ?? 0)
                : null,
            $this->steps->contains(fn ($result) => $result->usage->cacheReadInputTokens !== null)
                ? $this->steps->sum(fn ($result) => $result->usage->cacheReadInputTokens ?? 0)
                : null,
            $this->steps->contains(fn ($result) => $result->usage->thoughtTokens !== null)
                ? $this->steps->sum(fn ($result) => $result->usage->thoughtTokens ?? 0)
                : null,
        );
    }
}
