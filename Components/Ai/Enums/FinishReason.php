<?php

namespace SuggerenceGutenberg\Components\Ai\Enums;

enum FinishReason
{
    case Stop;
    case Length;
    case ContentFilter;
    case ToolCalls;
    case Error;
    case Other;
    case Unknown;
}
