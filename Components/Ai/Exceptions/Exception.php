<?php

namespace SuggerenceGutenberg\Components\Ai\Exceptions;

class Exception extends \Exception
{
    public static function promptOrMessages()
    {
        return new self('You can only use `prompt` or `messages`');
    }

    public static function toolNotFound($name, $previous)
    {
        return new self(
            sprintf('Tool (%s) not found', $name),
            0,
            $previous
        );
    }

    public static function multipleToolsFound($name, $previous)
    {
        return new self(
            sprintf('Multiple tools with the same name %s found', $name),
            0,
            $previous
        );
    }

    public static function toolCallFailed($toolCall, $previous)
    {
        return new self(
            sprintf('Calling %s tool failed', $toolCall->name),
            0,
            $previous
        );
    }

    public static function invalidParameterInTool($toolName, $previous)
    {
        return new self(
            sprintf('Invalid parameters for tool : %s', $toolName),
            0,
            $previous
        );
    }

    public static function invalidReturnTypeInTool($toolName, $previous)
    {
        return new self(
            sprintf('Invalid return type for tool : %s. Tools must return string.', $toolName),
            0,
            $previous
        );
    }

    public static function providerResponseError($message)
    {
        return new self($message);
    }

    public static function providerRequestError($model, $previous)
    {
        return new self(vsprintf('Sending to model (%s) failed: %s', [
            $model,
            $previous->getMessage()
        ]), 0, $previous);
    }

    public static function unsupportedProviderAction($method, $provider)
    {
        return new self(sprintf(
            '%s is not supported by %s',
            ucfirst($method),
            $provider
        ));
    }
}
