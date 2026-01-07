import type { JSONSchema7 } from 'json-schema';

export interface ToolDefinition {
    name: string;
    description: string;
    inputSchema: JSONSchema7;
    outputSchema: JSONSchema7;
    execute: (input: any) => Promise<any> | any;
}
