<?php

namespace SuggerenceGutenberg\Components\Ai\Concerns;

use SuggerenceGutenberg\Components\Ai\Enums\StructuredMode;

trait ConfiguresStructuredOutput
{
    protected StructuredMode $structuredMode = StructuredMode::Auto;

    public function usingStructuredMode(StructuredMode $mode): self
    {
        $this->structuredMode = $mode;

        return $this;
    }
}
