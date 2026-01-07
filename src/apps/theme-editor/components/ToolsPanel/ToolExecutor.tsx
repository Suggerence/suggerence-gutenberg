import { useState, useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { ArrowLeft, Play, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { executeTool } from '../../tools/utils';
import type { ToolDefinition } from '../../types/tool';
import type { JSONSchema7 } from 'json-schema';

interface ToolExecutorProps {
    tool: ToolDefinition;
    onBack: () => void;
}

// Helper to get default value from schema
const getDefaultValue = (schema: JSONSchema7): any => {
    if (schema.default !== undefined) {
        return schema.default;
    }
    
    switch (schema.type) {
        case 'string':
            return '';
        case 'number':
        case 'integer':
            return 0;
        case 'boolean':
            return false;
        case 'array':
            return [];
        case 'object':
            return {};
        default:
            return null;
    }
};

// Helper to check if a value is required
const isRequired = (propertyName: string, required: string[] = []): boolean => {
    return required.includes(propertyName);
};

// Helper to validate if all required fields are filled
const validateRequiredFields = (values: Record<string, any>, schema: JSONSchema7): boolean => {
    if (!schema.properties || !schema.required) {
        return true;
    }

    return schema.required.every((field: string) => {
        const value = values[field];
        if (value === undefined || value === null || value === '') {
            return false;
        }
        if (Array.isArray(value) && value.length === 0) {
            return false;
        }
        if (typeof value === 'object' && Object.keys(value).length === 0) {
            return false;
        }
        return true;
    });
};

export const ToolExecutor = ({ tool, onBack }: ToolExecutorProps) => {
    const [formValues, setFormValues] = useState<Record<string, any>>(() => {
        const initial: Record<string, any> = {};
        if (tool.inputSchema.properties) {
            Object.entries(tool.inputSchema.properties).forEach(([key, schema]) => {
                initial[key] = getDefaultValue(schema as JSONSchema7);
            });
        }
        return initial;
    });

    const [output, setOutput] = useState<any>(null);
    const [isExecuting, setIsExecuting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const isValid = useMemo(() => {
        return validateRequiredFields(formValues, tool.inputSchema);
    }, [formValues, tool.inputSchema]);

    const handleInputChange = (field: string, value: any) => {
        setFormValues(prev => ({
            ...prev,
            [field]: value
        }));
        setError(null);
    };

    const handleExecute = async () => {
        if (!isValid || isExecuting) return;

        setIsExecuting(true);
        setError(null);
        setOutput(null);

        try {
            // Use unified tool execution utility
            const executionResult = await executeTool(tool.name, formValues);
            
            if (executionResult.success) {
                setOutput(executionResult.result);
            } else {
                setError(executionResult.error || __('An error occurred while executing the tool', 'suggerence'));
            }
        } catch (err: any) {
            setError(err?.message || __('An error occurred while executing the tool', 'suggerence'));
        } finally {
            setIsExecuting(false);
        }
    };

    const renderInput = (field: string, schema: JSONSchema7, required: string[] = []) => {
        const value = formValues[field] ?? getDefaultValue(schema);
        const requiredField = isRequired(field, required);

        switch (schema.type) {
            case 'string': {
                // Handle enum strings
                if (schema.enum && Array.isArray(schema.enum)) {
                    return (
                        <div key={field} className="space-y-2">
                            <div className="flex items-center gap-2">
                                <Label htmlFor={field} className="text-sm">
                                    {field}
                                    {requiredField && <span className="text-destructive ml-1">*</span>}
                                </Label>
                                {schema.description && (
                                    <>
                                        <span className="text-xs text-muted-foreground">—</span>
                                        <p className="text-xs text-muted-foreground">{schema.description}</p>
                                    </>
                                )}
                            </div>
                            <select
                                id={field}
                                value={value}
                                onChange={(e) => handleInputChange(field, e.target.value)}
                                className="w-full h-9 rounded-md border border-border bg-background px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                            >
                                <option value="">{__("Select an option", "suggerence")}</option>
                                {schema.enum.map((enumValue) => (
                                    <option key={String(enumValue)} value={String(enumValue)}>
                                        {String(enumValue)}
                                    </option>
                                ))}
                            </select>
                        </div>
                    );
                }
                const isMultiline = schema.format === 'textarea' || (schema as any).multiline;
                return isMultiline ? (
                    <div key={field} className="space-y-2">
                        <Label htmlFor={field} className="text-sm">
                            {field}
                            {requiredField && <span className="text-destructive ml-1">*</span>}
                        </Label>
                        <Textarea
                            id={field}
                            value={value}
                            onChange={(e) => handleInputChange(field, e.target.value)}
                            placeholder={schema.description || field}
                            className="min-h-[100px]"
                        />
                        {schema.description && (
                            <p className="text-xs text-muted-foreground">{schema.description}</p>
                        )}
                    </div>
                ) : (
                    <div key={field} className="space-y-2">
                        <Label htmlFor={field} className="text-sm">
                            {field}
                            {requiredField && <span className="text-destructive ml-1">*</span>}
                        </Label>
                        <Input
                            id={field}
                            type="text"
                            value={value}
                            onChange={(e) => handleInputChange(field, e.target.value)}
                            placeholder={schema.description || field}
                        />
                        {schema.description && (
                            <p className="text-xs text-muted-foreground">{schema.description}</p>
                        )}
                    </div>
                );
            }
            case 'number':
            case 'integer':
                return (
                    <div key={field} className="space-y-2">
                        <div className="flex items-center gap-2">
                            <Label htmlFor={field} className="text-sm">
                                {field}
                                {requiredField && <span className="text-destructive ml-1">*</span>}
                            </Label>
                            {schema.description && (
                                <>
                                    <span className="text-xs text-muted-foreground">—</span>
                                    <p className="text-xs text-muted-foreground">{schema.description}</p>
                                </>
                            )}
                        </div>
                        <Input
                            id={field}
                            type="number"
                            value={value}
                            onChange={(e) => handleInputChange(field, Number(e.target.value))}
                            placeholder={schema.description || field}
                        />
                    </div>
                );
            case 'boolean':
                return (
                    <div key={field} className="space-y-2">
                        <div className="flex items-center gap-2">
                            <input
                                id={field}
                                type="checkbox"
                                checked={value}
                                onChange={(e) => handleInputChange(field, e.target.checked)}
                                className="size-4 rounded border-border"
                            />
                            <Label htmlFor={field} className="text-sm cursor-pointer">
                                {field}
                                {requiredField && <span className="text-destructive ml-1">*</span>}
                            </Label>
                            {schema.description && (
                                <>
                                    <span className="text-xs text-muted-foreground">—</span>
                                    <p className="text-xs text-muted-foreground">{schema.description}</p>
                                </>
                            )}
                        </div>
                    </div>
                );
            case 'array':
                // Handle enum arrays differently
                if (schema.items && (schema.items as JSONSchema7).enum) {
                    const enumValues = (schema.items as JSONSchema7).enum as string[];
                    return (
                        <div key={field} className="space-y-2">
                            <div className="flex items-center gap-2">
                                <Label htmlFor={field} className="text-sm">
                                    {field}
                                    {requiredField && <span className="text-destructive ml-1">*</span>}
                                </Label>
                                {schema.description && (
                                    <>
                                        <span className="text-xs text-muted-foreground">—</span>
                                        <p className="text-xs text-muted-foreground">{schema.description}</p>
                                    </>
                                )}
                            </div>
                            <div className="space-y-2">
                                {enumValues.map((enumValue, index) => (
                                    <div key={index} className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            id={`${field}-${index}`}
                                            checked={Array.isArray(value) && value.includes(enumValue)}
                                            onChange={(e) => {
                                                const currentArray = Array.isArray(value) ? value : [];
                                                if (e.target.checked) {
                                                    handleInputChange(field, [...currentArray, enumValue]);
                                                } else {
                                                    handleInputChange(field, currentArray.filter(v => v !== enumValue));
                                                }
                                            }}
                                            className="size-4 rounded border-border"
                                        />
                                        <Label htmlFor={`${field}-${index}`} className="text-sm cursor-pointer">
                                            {enumValue}
                                        </Label>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                }
                return (
                    <div key={field} className="space-y-2">
                        <div className="flex items-center gap-2">
                            <Label htmlFor={field} className="text-sm">
                                {field}
                                {requiredField && <span className="text-destructive ml-1">*</span>}
                            </Label>
                            {schema.description && (
                                <>
                                    <span className="text-xs text-muted-foreground">—</span>
                                    <p className="text-xs text-muted-foreground">{schema.description}</p>
                                </>
                            )}
                        </div>
                        <Textarea
                            id={field}
                            value={Array.isArray(value) ? value.join('\n') : ''}
                            onChange={(e) => {
                                const lines = e.target.value.split('\n').filter(line => line.trim());
                                handleInputChange(field, lines);
                            }}
                            placeholder={schema.description || 'Enter one item per line'}
                            className="min-h-[100px]"
                        />
                    </div>
                );
            case 'object':
                return (
                    <div key={field} className="space-y-2">
                        <div className="flex items-center gap-2">
                            <Label htmlFor={field} className="text-sm">
                                {field}
                                {requiredField && <span className="text-destructive ml-1">*</span>}
                            </Label>
                            {schema.description && (
                                <>
                                    <span className="text-xs text-muted-foreground">—</span>
                                    <p className="text-xs text-muted-foreground">{schema.description}</p>
                                </>
                            )}
                        </div>
                        <Textarea
                            id={field}
                            value={typeof value === 'object' ? JSON.stringify(value, null, 2) : ''}
                            onChange={(e) => {
                                try {
                                    const parsed = JSON.parse(e.target.value);
                                    handleInputChange(field, parsed);
                                } catch {
                                    // Invalid JSON, keep as string for now
                                }
                            }}
                            placeholder={schema.description || 'Enter JSON object'}
                            className="min-h-[100px] font-mono text-xs"
                        />
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center gap-2">
                <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={onBack}
                    className="h-7 w-7"
                >
                    <ArrowLeft className="size-4" />
                </Button>
                <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-primary!">{tool.name}</h3>
                    <span className="text-xs text-muted-foreground">—</span>
                    <p className="text-xs text-muted-foreground">{tool.description}</p>
                </div>
            </div>

            {/* Input Form */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-sm text-primary!">{__("Input Parameters", "suggerence")}</CardTitle>
                    <CardDescription className="text-xs">
                        {__("Fill in the required fields to execute the tool", "suggerence")}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {tool.inputSchema.properties ? (
                        Object.entries(tool.inputSchema.properties).map(([field, schema]) =>
                            renderInput(field, schema as JSONSchema7, tool.inputSchema.required as string[])
                        )
                    ) : (
                        <p className="text-sm text-muted-foreground">
                            {__("This tool requires no input parameters", "suggerence")}
                        </p>
                    )}

                    <div className="flex items-center gap-2 pt-2 border-t border-border/50">
                        <Button
                            onClick={handleExecute}
                            disabled={!isValid || isExecuting}
                        >
                            {isExecuting ? (
                                <>
                                    <Loader2 className="size-4 mr-2 animate-spin" />
                                    {__("Executing...", "suggerence")}
                                </>
                            ) : (
                                <>
                                    <Play className="size-4 mr-2" />
                                    {__("Execute Tool", "suggerence")}
                                </>
                            )}
                        </Button>
                    </div>

                    {error && (
                        <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20">
                            <p className="text-sm text-destructive">{error}</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Output */}
            {output !== null && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm">{__("Output", "suggerence")}</CardTitle>
                        <CardDescription className="text-xs">
                            {__("Result from tool execution", "suggerence")}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md bg-muted/50 p-4 overflow-auto max-h-[400px] sugg-scrollbar theme-editor-tool-output">
                            <pre className="text-xs font-mono text-foreground whitespace-pre-wrap">
                                {JSON.stringify(output, null, 2)}
                            </pre>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};
