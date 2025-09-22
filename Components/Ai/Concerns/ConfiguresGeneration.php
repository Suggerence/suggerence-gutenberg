<?php

namespace SuggerenceGutenberg\Components\Ai\Concerns;

trait ConfiguresGeneration
{
    protected $maxSteps = 1;

    public function withMaxSteps($steps)
    {
        $this->maxSteps = $steps;

        return $this;
    }
}
