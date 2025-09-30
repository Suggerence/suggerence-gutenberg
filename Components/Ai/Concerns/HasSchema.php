<?php

namespace SuggerenceGutenberg\Components\Ai\Concerns;

use SuggerenceGutenberg\Components\Ai\Contracts\Schema;

trait HasSchema
{
    protected ?Schema $schema = null;

    public function withSchema(Schema $schema): self
    {
        $this->schema = $schema;

        return $this;
    }
}
