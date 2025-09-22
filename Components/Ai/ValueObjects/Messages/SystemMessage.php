<?php

namespace SuggerenceGutenberg\Components\Ai\ValueObjects\Messages;

use SuggerenceGutenberg\Components\Ai\Concerns\HasProviderOptions;
use SuggerenceGutenberg\Components\Ai\Contracts\Message;

class SystemMessage implements Message
{
    use HasProviderOptions;

    public function __construct(
        public $content
    ) {}
}
