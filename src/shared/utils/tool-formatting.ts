import { getToolMetadata } from '@/shared/mcps/tools/tool-metadata';

const TOOL_PREFIX_REGEX = /^[^_]+___/;

const TOOL_SEARCH_DEFINITION = {
    type: 'tool_search_tool_regex_20251119',
    name: 'tool_search_tool_regex'
};

const CODE_EXECUTION_TOOL = {
    type: 'code_execution_20250825',
    name: 'code_execution'
};

interface BuildToolOptions {
    includeCodeExecution?: boolean;
}

const cleanJsonSchema = (obj: any): any => {
    if (obj === null || typeof obj !== 'object') {
        return obj;
    }

    if (Array.isArray(obj)) {
        return obj.map(cleanJsonSchema);
    }

    const cleaned: Record<string, any> = {};

    for (const [key, value] of Object.entries(obj)) {
        if (key === 'required' && typeof value === 'boolean') {
            continue;
        }

        if (key === 'additionalProperties') {
            if (typeof value === 'boolean') {
                cleaned[key] = value;
            }
            continue;
        }

        cleaned[key] = typeof value === 'object' && value !== null
            ? cleanJsonSchema(value)
            : value;
    }

    return cleaned;
};

const stripToolPrefix = (toolName?: string): string =>
    (toolName || '').replace(TOOL_PREFIX_REGEX, '');

export const buildAnthropicTools = (
    tools?: SuggerenceMCPResponseTool[],
    options: BuildToolOptions = {}
): any[] => {
    if (!tools || tools.length === 0) {
        return options.includeCodeExecution ? [CODE_EXECUTION_TOOL] : [];
    }

    const formattedTools = tools.map((tool) => {
        const inputSchema = tool.inputSchema || (tool as any).input_schema;
        const base: Record<string, any> = {
            name: tool.name,
            description: tool.description,
            input_schema: inputSchema ? cleanJsonSchema(inputSchema) : {}
        };

        // const metadata = getToolMetadata(stripToolPrefix(tool.name));
        // const inputExamples = tool.inputExamples || metadata.inputExamples;
        // if (inputExamples && inputExamples.length > 0) {
        //     base.input_examples = inputExamples;
        // }

        // const shouldDefer = tool.deferLoading ?? metadata.deferLoading ?? false;
        // if (shouldDefer) {
        //     base.defer_loading = true;
        // }

        return base;
    });

    const shouldIncludeSearchTool = false; //formattedTools.length > 0;
    const withOptionalSearch = shouldIncludeSearchTool
        ? [TOOL_SEARCH_DEFINITION, ...formattedTools]
        : formattedTools;

    if (options.includeCodeExecution) {
        return [...withOptionalSearch, CODE_EXECUTION_TOOL];
    }

    return withOptionalSearch;
};
