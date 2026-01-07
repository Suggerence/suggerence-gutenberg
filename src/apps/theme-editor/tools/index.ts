import type { ToolDefinition } from '../types/tool';
import { listPathsTool } from './listPaths';
import { navigateTool } from './navigate';
import { listStylesTool } from './listStyles';
import { readStyleTool } from './readStyle';

export const tools: ToolDefinition[] = [
    listPathsTool,
    navigateTool,
    listStylesTool,
    readStyleTool
];
