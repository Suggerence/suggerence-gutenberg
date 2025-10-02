<?php

namespace SuggerenceGutenberg\Components\Ai\Providers\OpenAI\Handlers;

use SuggerenceGutenberg\Components\Ai\Providers\Anthropic\Concerns\ProcessesRateLimits as ConcernsProcessesRateLimits;
use SuggerenceGutenberg\Components\Ai\Providers\OpenAI\Concerns\ValidatesResponse;
use SuggerenceGutenberg\Components\Ai\Exceptions\Exception;
use SuggerenceGutenberg\Components\Ai\Providers\OpenAI\Maps\TextToSpeechRequestMapper;
use SuggerenceGutenberg\Components\Ai\ValueObjects\Usage;
use SuggerenceGutenberg\Components\Ai\Audio\Response as AudioResponse;
use SuggerenceGutenberg\Components\Ai\Audio\TextResponse;
use SuggerenceGutenberg\Components\Ai\ValueObjects\GeneratedAudio;
use SuggerenceGutenberg\Components\Ai\Helpers\Functions;

class Audio
{
    use ConcernsProcessesRateLimits;
    use ValidatesResponse;

    public function __construct(protected $client) {}

    public function handleTextToSpeech($request)
    {
        $mapper = new TextToSpeechRequestMapper($request);

        $response = $this->client->post('audio/speech', $mapper->toPayload());
        
        if (!$response->successful()) {
            throw new Exception('Failed to generate audio: ' . $response->body());
        }

        $audioContent   = $response->body();
        $base64Audio    = base64_encode($audioContent);

        return new AudioResponse(
            new GeneratedAudio($base64Audio)
        );
    }

    public function handleSpeechToText($request)
    {
        $response = $this->client
            ->attach(
                'file',
                $request->input()->resource(),
                'audio',
                ['Content-Type' => $request->input()->mimeType()]
            )
            ->post(
                'audio/transcriptions',
                Functions::where_not_null([
                    'model'             => $request->model(),
                    'language'          => $request->providerOptions('language') ?? null,
                    'prompt'            => $request->providerOptions('prompt') ?? null,
                    'response_format'   => $request->providerOptions('response_format') ?? null,
                    'temperature'       => $request->providerOptions('temperature') ?? null
                ])
            );

        if (json_validate($response->body())) {
            $data = $response->json();

            $this->validateResponse($response);

            return new TextResponse(
                $data['text'] ?? '',
                isset($data['usage'])
                    ? new Usage(
                        $data['usage']['input_tokens'] ?? 0,
                        $data['usage']['total_tokens'] ?? 0
                    )
                    : null,
                $data
            );
        }

        return new TextResponse($response->body());
    }
}
