import type { ToolDefinition } from '../types/tool';
import { listPathsTool } from './listPaths';
import { navigateTool } from './navigate';
import { listStylesTool } from './listStyles';
import { readStyleTool } from './readStyle';
import { editStyleTool } from './editStyle';
import { searchStylesTool } from './searchStyles';

export const tools: ToolDefinition[] = [
    listPathsTool,
    navigateTool,
    searchStylesTool,
    readStyleTool,
    editStyleTool
];
