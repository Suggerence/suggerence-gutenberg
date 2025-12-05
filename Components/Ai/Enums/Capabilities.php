<?php

namespace SuggerenceGutenberg\Components\Ai\Enums;

class Capabilities
{
    const TEXT_GENERATION       = 'text_generation';
    const FUNCTION_CALLING      = 'function_calling';
    const CHAT_HISTORY          = 'chat_history';
    const MULTIMODAL_INPUT      = 'multimodal_input';
    const MULTIMODAL_OUTPUT     = 'multimodal_output';
    const TEXT_TO_SPEECH        = 'text_to_speech';
    const TEXT_EMBEDDINGS       = 'text_embeddings';
    const MEDIA_EMBEDDINGS      = 'media_embeddings';
    const WEB_SEARCH            = 'web_search';
    const REAL_TIME_OUTPUT      = 'real_time_output';
    const REASONING             = 'reasoning';

    const RETURNS_TOKEN_USAGE   = 'returns_token_usage';
    const CACHED_OUTPUT         = 'cached_output';
    const BATCH_GENERATION      = 'batch_generation';
}
