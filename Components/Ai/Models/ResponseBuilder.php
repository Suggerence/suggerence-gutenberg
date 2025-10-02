<?php

namespace SuggerenceGutenberg\Components\Ai\Models;

use SuggerenceGutenberg\Components\Ai\Helpers\Collection;

class ResponseBuilder
{
    public $models;

    public function __construct()
    {
        $this->models = new Collection;
    }

    public function addModel($model)
    {
        $this->models->push($model);

        return $this;
    }
    
    public function toResponse()
    {
        return $this->models->toArray();
    }
}
