<?php

namespace SuggerenceGutenberg\Components\Ai\Providers\Anthropic\ValueObjects;

use SuggerenceGutenberg\Components\Ai\ValueObjects\MessagePartWithCitations;
use SuggerenceGutenberg\Components\Ai\Helpers\Functions;

class StreamState
{
    public function __construct(
        protected $model = '',
        protected $requestId = '',
        protected $text = '',
        protected $toolCalls = [],
        protected $thinking = '',
        protected $thinkingSignature = '',
        protected $citations = [],
        protected $stopReason = '',
        protected $usage = [],
        protected $tempContentBlockType = null,
        protected $tempContentBlockIndex = null,
        protected $tempCitation = null,
    ) {}

    public function model()
    {
        return $this->model;
    }

    public function setModel($model)
    {
        $this->model = $model;

        return $this;
    }

    public function requestId()
    {
        return $this->requestId;
    }

    public function setRequestId($requestId)
    {
        $this->requestId = $requestId;

        return $this;
    }

    public function text()
    {
        return $this->text;
    }

    public function appendText($text)
    {
        $this->text .= $text;

        return $this;
    }

    public function toolCalls()
    {
        return $this->toolCalls;
    }

    public function setToolCalls($toolCalls)
    {
        $this->toolCalls = $toolCalls;

        return $this;
    }

    public function addToolCall($index, $toolCall)
    {
        $this->toolCalls[$index] = $toolCall;

        return $this;
    }

    public function appendToolCallInput($index, $input)
    {
        if (isset($this->toolCalls[$index])) {
            $this->toolCalls[$index]['input'] .= $input;
        }

        return $this;
    }

    public function thinking()
    {
        return $this->thinking;
    }

    public function appendThinking($thinking)
    {
        $this->thinking .= $thinking;

        return $this;
    }

    public function thinkingSignature()
    {
        return $this->thinkingSignature;
    }

    public function appendThinkingSignature($signature)
    {
        $this->thinkingSignature .= $signature;

        return $this;
    }

    public function citations()
    {
        return $this->citations;
    }

    public function addCitation($citation)
    {
        if (!$citation instanceof MessagePartWithCitations) {
            return $this;
        }

        $this->citations[] = $citation;

        return $this;
    }

    public function stopReason()
    {
        return $this->stopReason;
    }

    public function setStopReason($reason)
    {
        $this->stopReason = $reason;

        return $this;
    }

    public function usage()
    {
        return $this->usage;
    }

    public function setUsage($usage)
    {
        if ($this->usage === []) {
            $this->usage = $usage;
        } else {
            foreach (Functions::arr_dot($usage) as $key => $value) {
                Functions::arr_set($this->usage, $key, Functions::arr_get($this->usage, $key, 0) + $value);
            }
        }

        return $this;
    }

    public function tempContentBlockType()
    {
        return $this->tempContentBlockType;
    }

    public function setTempContentBlockType($type)
    {
        $this->tempContentBlockType = $type;

        return $this;
    }

    public function tempContentBlockIndex()
    {
        return $this->tempContentBlockIndex;
    }

    public function setTempContentBlockIndex($index)
    {
        $this->tempContentBlockIndex = $index;

        return $this;
    }

    public function tempCitation()
    {
        return $this->tempCitation;
    }

    public function setTempCitation($citation)
    {
        $this->tempCitation = $citation;

        return $this;
    }

    public function hasToolCalls()
    {
        return $this->toolCalls !== [];
    }

    public function isToolUseFinish()
    {
        return $this->stopReason === 'tool_use' && $this->hasToolCalls();
    }

    public function reset()
    {
        $this->model = '';
        $this->requestId = '';
        $this->text = '';
        $this->toolCalls = [];
        $this->thinking = '';
        $this->thinkingSignature = '';
        $this->citations = [];
        $this->stopReason = '';
        $this->usage = [];
        $this->tempContentBlockType = null;
        $this->tempContentBlockIndex = null;
        $this->tempCitation = null;

        return $this;
    }

    public function buildAdditionalContent()
    {
        $additionalContent = [];

        if ($this->thinking !== '') {
            $additionalContent['thinking'] = $this->thinking;

            if ($this->thinkingSignature !== '') {
                $additionalContent['thinking_signature'] = $this->thinkingSignature;
            }
        }

        if ($this->citations !== []) {
            $additionalContent['citations'] = $this->citations;
        }

        return $additionalContent;
    }

    public function resetContentBlock()
    {
        $this->tempContentBlockType = null;
        $this->tempContentBlockIndex = null;
        $this->tempCitation = null;

        return $this;
    }
}
