<?php

namespace SuggerenceGutenberg\Components\Ai\Concerns;

use SuggerenceGutenberg\Components\Ai\Exceptions\Exception;
use SuggerenceGutenberg\Components\Ai\ValueObjects\ToolResult;
use SuggerenceGutenberg\Components\Ai\Helpers\Functions;

use Throwable;

trait CallsTools
{
    public function callTools($tools, $toolCalls)
    {
        return array_map(
            function($toolCall) use ($tools) {
                $tool = $this->resolveTool($toolCall->name, $tools);

                try {
                    $result = call_user_func_array(
                        $tool->handle(...),
                        $toolCall->arguments()
                    );

                    return new ToolResult(
                        $toolCall->id,
                        $toolCall->name,
                        $toolCall->arguments(),
                        $result,
                        $toolCall->resultId
                    );
                } catch (Throwable $e) {
                    if ($e instanceof Exception) {
                        throw $e;
                    }

                    throw Exception::toolCallFailed($toolCall, $e);
                }
            },
            $toolCalls
        );
    }

    protected function resolveTool($name, $tools)
    {
        $toolsCollection = Functions::collect($tools);
        
        try {
            // First, try exact match
            return $toolsCollection->sole(fn ($tool) => $tool->name() === $name);
        } catch (Throwable $e) {
            // If exact match fails, try with known prefixes
            $knownPrefixes = ['gutenberg___', 'frontend___', 'mcp___'];
            
            foreach ($knownPrefixes as $prefix) {
                try {
                    return $toolsCollection->sole(fn ($tool) => $tool->name() === $prefix . $name);
                } catch (Throwable $prefixException) {
                    // Continue to next prefix
                    continue;
                }
            }
            
            // If all attempts fail, throw original exception
            throw Exception::toolNotFound($name, $e);
        }
    }
}
