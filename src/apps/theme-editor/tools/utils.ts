import type { ToolDefinition } from '../types/tool';
import { tools } from './index';

export interface ToolExecutionResult {
    success: boolean;
    result?: any;
    error?: string;
}

/**
 * Executes a tool by name with the provided input.
 * This is a unified way to execute tools that can be used by both
 * ToolExecutor and WebsocketHandler.
 * 
 * @param toolName - The name of the tool to execute
 * @param input - The input parameters for the tool
 * @returns Promise resolving to the execution result
 */
export async function executeTool(
    toolName: string,
    input: Record<string, unknown>
): Promise<ToolExecutionResult> {
    // Find the tool by name
    const tool = tools.find((t: ToolDefinition) => t.name === toolName);

    if (!tool) {
        return {
            success: false,
            error: `Tool "${toolName}" not found`
        };
    }

    // Validate input (basic check - ensure required fields are present)
    if (tool.inputSchema.required && Array.isArray(tool.inputSchema.required)) {
        const missingFields = tool.inputSchema.required.filter(
            (field: string) => input[field] === undefined || input[field] === null || input[field] === ''
        );

        if (missingFields.length > 0) {
            return {
                success: false,
                error: `Missing required fields: ${missingFields.join(', ')}`
            };
        }
    }

    try {
        // Execute the tool
        const result = await Promise.resolve(tool.execute(input));
        
        return {
            success: true,
            result
        };
    } catch (error: any) {
        return {
            success: false,
            error: error?.message || 'An error occurred while executing the tool'
        };
    }
}
