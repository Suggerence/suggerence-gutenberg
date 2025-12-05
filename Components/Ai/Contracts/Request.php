<?php

namespace SuggerenceGutenberg\Components\Ai\Contracts;

interface Request 
{
    public function is($classString);

    public function model();

    public function withProviderOptions($options = []);

    public function providerOptions($valuePath = null);
}
