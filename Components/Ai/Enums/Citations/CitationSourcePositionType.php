<?php

namespace SuggerenceGutenberg\Components\Ai\Enums\Citations;

enum CitationSourcePositionType: string
{
    case Character = 'character';
    case Page = 'page';
    case Chunk = 'chunk';
}
