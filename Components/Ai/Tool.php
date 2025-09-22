<?php

namespace SuggerenceGutenberg\Components\Ai;

use ArgumentCountError;
use Closure;
use Error;
use Throwable;
use InvalidArgumentException;
use TypeError;
use Illuminate\Support\Arr;
use SuggerenceGutenberg\Components\Ai\Concerns\HasProviderOptions;
use SuggerenceGutenberg\Components\Ai\Exceptions\Exception;
use SuggerenceGutenberg\Components\Ai\Schema\ArraySchema;
use SuggerenceGutenberg\Components\Ai\Schema\BooleanSchema;
use SuggerenceGutenberg\Components\Ai\Schema\EnumSchema;
use SuggerenceGutenberg\Components\Ai\Schema\NumberSchema;
use SuggerenceGutenberg\Components\Ai\Schema\ObjectSchema;
use SuggerenceGutenberg\Components\Ai\Schema\StringSchema;

class Tool
{
    use HasProviderOptions;

    protected $name;

    protected $description;

    protected $parameters = [];

    protected $requiredParameters = [];

    protected $fn;

    protected $failedHandler = null;

    public function __construct() {}

    public function as($name)
    {
        $this->name = $name;

        return $this;
    }

    public function for($description)
    {
        $this->description = $description;

        return $this;
    }

    public function using($fn)
    {
        $this->fn = $fn;

        return $this;
    }

    public function failed($handler)
    {
        $this->failedHandler = $handler;

        return $this;
    }

    public function withoutErrorHandling()
    {
        $this->failedHandler = false;

        return $this;
    }

    public function withErrorHandling($handler = null)
    {
        $this->failedHandler = $handler;

        return $this;
    }

    public function withParameters($parameter, $required = true)
    {
        $this->parameters[$parameter->name()] = $parameter;

        if ($required) {
            $this->requiredParameters[] = $parameter->name();
        }

        return $this;
    }

    public function withStringParameter($name, $description, $required = true)
    {
        $this->withParameters(new StringSchema($name, $description), $required);

        return $this;
    }

    public function withNumberParameter($name, $description, $required = true)
    {
        $this->withParameters(new NumberSchema($name, $description), $required);

        return $this;
    }

    public function withBooleanParameter($name, $description, $required = true)
    {
        $this->withParameters(new BooleanSchema($name, $description), $required);

        return $this;
    }

    public function withArrayParameter($name, $description, $items, $required = true)
    {
        $this->withParameters(new ArraySchema($name, $description, $items), $required);

        return $this;
    }

    public function withObjectParameter($name, $description, $properties, $requiredFields = [], $allowAdditionalProperties = false, $required = true)
    {
        $this->withParameters(new ObjectSchema($name, $description, $properties, $requiredFields, $allowAdditionalProperties), $required);

        return $this;
    }

    public function withEnumParameter($name, $description, $options, $required = true)
    {
        $this->withParameters(new EnumSchema($name, $description, $options), $required);

        return $this;
    }

    public function requiredParameters()
    {
        return $this->requiredParameters;
    }

    public function parameters()
    {
        return $this->parameters;
    }

    public function parametersAsArray()
    {
        return Arr::mapWithKeys($this->parameters, fn ($schema, $name) => [$name => $schema->toArray()]);
    }

    public function name()
    {
        return $this->name;
    }

    public function description()
    {
        return $this->description;
    }

    public function hasParameters()
    {
        return (bool) count($this->parameters);
    }

    public function failedHandler()
    {
        return $this->failedHandler;
    }

    public function handle(...$args)
    {
        try {
            $value = call_user_func($this->fn, ...$args);

            if (!is_string($value)) {
                throw Exception::invalidReturnTypeInTool($this->name, new TypeError('Return value must be of type string'));
            }

            return $value;
        } catch (Throwable $e) {
            return $this->handleToolException($e, $args);
        }
    }

    public static function formatFromSchema($schema)
    {
        $tool = new static();
        
        // Set basic properties
        $tool->name = $schema['name'] ?? null;
        $tool->description = $schema['description'] ?? null;
        
        // Parse input schema if present
        if (isset($schema['inputSchema']) && is_array($schema['inputSchema'])) {
            $inputSchema = $schema['inputSchema'];
            
            // Handle required parameters
            $requiredParams = $inputSchema['required'] ?? [];
            
            // Parse properties
            if (isset($inputSchema['properties']) && is_array($inputSchema['properties'])) {
                foreach ($inputSchema['properties'] as $paramName => $paramSchema) {
                    $isRequired = in_array($paramName, $requiredParams);
                    $schemaObject = static::createSchemaFromArray($paramName, $paramSchema);
                    
                    if ($schemaObject) {
                        $tool->withParameters($schemaObject, $isRequired);
                    }
                }
            }
        }
        
        return $tool;
    }
    
    protected static function createSchemaFromArray($name, $schema)
    {
        $type = $schema['type'] ?? null;
        $description = $schema['description'] ?? '';
        $nullable = is_array($type) && in_array('null', $type);
        
        // Handle nullable types
        if (is_array($type)) {
            $type = collect($type)->filter(fn($t) => $t !== 'null')->first();
        }
        
        return match ($type) {
            'string' => new StringSchema($name, $description, $nullable),
            'number', 'integer' => new NumberSchema($name, $description, $nullable),
            'boolean' => new BooleanSchema($name, $description, $nullable),
            'array' => static::createArraySchema($name, $schema, $nullable),
            'object' => static::createObjectSchema($name, $schema, $nullable),
            default => static::createEnumSchema($name, $schema, $nullable)
        };
    }
    
    protected static function createArraySchema($name, $schema, $nullable)
    {
        $items = null;
        
        if (isset($schema['items'])) {
            $itemsSchema = $schema['items'];
            $itemsType = $itemsSchema['type'] ?? 'string';
            
            // Create a simple schema for array items
            $items = match ($itemsType) {
                'string' => new StringSchema('item', $itemsSchema['description'] ?? 'Array item'),
                'number', 'integer' => new NumberSchema('item', $itemsSchema['description'] ?? 'Array item'),
                'boolean' => new BooleanSchema('item', $itemsSchema['description'] ?? 'Array item'),
                default => new StringSchema('item', $itemsSchema['description'] ?? 'Array item')
            };
        }
        
        return new ArraySchema($name, $schema['description'] ?? '', $items, $nullable);
    }
    
    protected static function createObjectSchema($name, $schema, $nullable)
    {
        $properties = [];
        $requiredFields = $schema['required'] ?? [];
        
        if (isset($schema['properties']) && is_array($schema['properties'])) {
            foreach ($schema['properties'] as $propName => $propSchema) {
                $properties[] = static::createSchemaFromArray($propName, $propSchema);
            }
        }
        
        $allowAdditionalProperties = $schema['additionalProperties'] ?? false;
        
        return new ObjectSchema($name, $schema['description'] ?? '', $properties, $requiredFields, $allowAdditionalProperties, $nullable);
    }
    
    protected static function createEnumSchema($name, $schema, $nullable)
    {
        if (isset($schema['enum']) && is_array($schema['enum'])) {
            return new EnumSchema($name, $schema['description'] ?? '', $schema['enum'], $nullable);
        }
        
        // Fallback to string schema if no enum is found
        return new StringSchema($name, $schema['description'] ?? '', $nullable);
    }

    protected function shouldHandleErrors()
    {
        return $this->failedHandler !== false;
    }

    protected function hasCustomErrorHandler()
    {
        return $this->failedHandler instanceof Closure;
    }

    protected function shouldUseDefaultErrorHandling()
    {
        return $this->shouldHandleErrors() && !$this->hasCustomErrorHandler();
    }

    protected function getDefaultFailedMessage($e, $providedParams)
    {
        $errorType = $this->classifyToolError($e);

        return match ($errorType) {
            'validation'    => $this->formatValidationError($e, $providedParams),
            'runtime'       => $this->formatRuntimeError($e),
            default         => $this->formatRuntimeError($e),
        };
    }

    protected function classifyToolError($e)
    {
        $isValidationError = $e instanceof TypeError || ($e instanceof Error && str_contains($e->getMessage(), 'Unknown named parameter'));

        return $isValidationError ? 'validation' : 'runtime';
    }

    protected function formatValidationError($e, $providedParams)
    {
        $errorType      = $this->determineValidationErrorType($e);
        $expectedParams = $this->formatExpectedParameters();
        $receivedParams = $this->formatReceivedParameters($providedParams);

        return sprintf(
            'Parameter validation error: %s. Expected: [%s]. Received: %s. Please provide correct parameter types and names.',
            $errorType,
            $expectedParams,
            $receivedParams
        );
    }

    protected function formatRuntimeError($e)
    {
        return sprintf(
            'Tool execution error: %s. This error occurred during tool execution, not due to invalid parameters.',
            $e->getMessage()
        );
    }

    protected function determineValidationErrorType($e)
    {
        return match (true) {
            $e instanceof ArgumentCountError                                                => 'Missing required parameters',
            $e instanceof TypeError && str_contains($e->getMessage(), 'must be of type')    => 'Type mismatch',
            str_contains($e->getMessage(), 'Unknown named parameter')                       => 'Unknown parameters',
            default                                                                         => 'Invalid parameters',
        };
    }

    protected function formatExpectedParameters()
    {
        return collect($this->parameters)
            ->map(fn($param): string => sprintf(
                '%s (%s%s)',
                $param->name(),
                class_basename($param),
                in_array($param->name(), $this->requiredParameters) ? ', required' : ''
            ))
            ->join(', ');
    }

    protected function formatReceivedParameters($providedParams)
    {
        return json_encode($providedParams) ?: '{}';
    }

    protected function extractProvidedParams($args)
    {
        if (! array_is_list($args)) {
            return $args;
        }

        $paramNames = array_keys($this->parameters);
        $result = [];

        foreach ($args as $index => $value) {
            if (isset($paramNames[$index])) {
                $result[$paramNames[$index]] = $value;
            }
        }

        return $result;
    }

    protected function handleToolException($e, $args)
    {
        if ($this->hasCustomErrorHandler()) {
            $providedParams = $this->extractProvidedParams($args);

            /** @var Closure(Throwable,array<int|string,mixed>):string $handler */
            $handler = $this->failedHandler;

            return $handler($e, $providedParams);
        }

        if (! $this->shouldHandleErrors()) {
            $this->throwMappedException($e);
        }

        if ($this->shouldUseDefaultErrorHandling()) {
            $providedParams = $this->extractProvidedParams($args);

            return $this->getDefaultFailedMessage($e, $providedParams);
        }

        throw $e;
    }

    protected function throwMappedException($e)
    {
        if ($e instanceof TypeError || $e instanceof InvalidArgumentException) {
            throw Exception::invalidParameterInTool($this->name, $e);
        }

        if ($e::class === Error::class && ! str_starts_with($e->getMessage(), 'Unknown named parameter')) {
            throw $e;
        }

        if (str_starts_with($e->getMessage(), 'Unknown named parameter')) {
            throw Exception::invalidParameterInTool($this->name, $e);
        }

        throw $e;
    }
}
