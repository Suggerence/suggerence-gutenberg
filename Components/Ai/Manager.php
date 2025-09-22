<?php

namespace SuggerenceGutenberg\Components\Ai;

use SuggerenceGutenberg\Components\Ai\Enums\Provider as ProviderEnum;

use InvalidArgumentException;
use SuggerenceGutenberg\Components\Ai\Providers\Anthropic\Anthropic;
use SuggerenceGutenberg\Components\Ai\Providers\Gemini\Gemini;
use SuggerenceGutenberg\Components\Ai\Providers\OpenAI\OpenAI;

class Manager
{
    public static function resolve($name, $providerConfig = [])
    {
        $name       = self::resolveName( $name );

        $config     = array_merge( self::defaultConfig( $name ), $providerConfig );
        
        $factory    = sprintf( 'create%sProvider', ucfirst( $name ) );

        if ( method_exists( self::class, $factory ) ) {
            return self::{$factory}( $config );
        }

        throw new InvalidArgumentException( "Provider [{$name}] is not supported." );
    }

    protected static function resolveName($name)
    {
        if ($name instanceof ProviderEnum) {
            $name = $name->value;
        }

        return strtolower( $name );
    }

    protected static function createOpenaiProvider($config)
    {
        return new OpenAI(
            $config['api_key'] ?? '',
            $config['url'] ?? null,
            $config['organization'] ?? null,
            $config['project'] ?? null,
        );
    }

    // protected static function createOllamaProvider($config)
    // {
    //     return new Ollama(
    //         $config['api_key'] ?? '',
    //         $config['url']
    //     );
    // }

    // protected static function createMistralProvider($config)
    // {
    //     return new Mistral(
    //         $config['api_key'],
    //         $config['url']
    //     );
    // }

    protected static function createAnthropicProvider($config)
    {
        return new Anthropic(
            $config['api_key'] ?? '',
            $config['version'] ?? '2023-06-01',
            $config['anthropic_beta'] ?? null
        );
    }

    // protected static function createDeepseekProvider($config)
    // {
    //     return new Deepseek(
    //         $config['api_key'] ?? '',
    //         $config['url'] ?? ''
    //     );
    // }

    // protected static function createVoyageaiProvider($config)
    // {
    //     return new VoyageAI(
    //         $config['api_key'] ?? '',
    //         $config['url'] ?? ''
    //     );
    // }

    // protected static function createGroqProvider($config)
    // {
    //     return new Groq(
    //         $config['api_key'],
    //         $config['url']
    //     );
    // }

    // protected static function createXaiProvider($config)
    // {
    //     return new XAI(
    //         $config['api_key'],
    //         $config['url']
    //     );
    // }

    protected static function createGeminiProvider($config)
    {
        return new Gemini(
            $config['api_key'],
            $config['url'] ?? ''
        );
    }

    // protected static function createOpenrouterProvider($config)
    // {
    //     return new Openrouter(
    //         $config['api_key'] ?? '',
    //         $config['url'] ?? 'https://openrouter.ai/api/v1'
    //     );
    // }

    // protected static function createElevenlabsProvider($config)
    // {
    //     return new Elevenlabs(
    //         $config['api_key'] ?? '',
    //         $config['url'] ?? 'https://api.elevenlabs.io/v1'
    //     );
    // }

    public static function defaultConfig($name)
    {
        $config = get_option("suggerence_{$name}_config", []);
        
        return $config ?? [];
    }

    public static function updateDefaultConfig($name, $config)
    {
        return update_option("suggerence_{$name}_config", $config);
    }

    public static function all()
    {
        $providers = [];

        foreach (ProviderEnum::cases() as $provider) {
            $providers[] = self::resolve($provider);
        }

        return $providers;
    }
}
