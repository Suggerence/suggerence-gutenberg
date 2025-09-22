<?php

namespace SuggerenceGutenberg\Components\Ai\Enums;

enum Provider: string
{
    case Anthropic = 'anthropic';
    case OpenAI = 'openai';
    case Gemini = 'gemini';
    // case Deepseek = 'deepseek';
    // case Ollama = 'ollama';
    // case OpenRouter = 'openrouter';
    // case Mistral = 'mistral';
    // case Groq = 'groq';
    // case XAI = 'xai';
    // case VoyageAI = 'voyageai';
    // case ElevenLabs = 'elevenlabs';
}
