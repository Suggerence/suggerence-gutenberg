import type { ToolDefinition } from '../types/tool';
import { listPathsTool } from './listPaths';
import { navigateTool } from './navigate';
import { listStylesTool } from './listStyles';
import { readStyleTool } from './readStyle';
import { editStyleTool } from './editStyle';
import { searchStylesTool } from './searchStyles';
import { searchFontsTool } from './searchFonts';
import { installFontTool } from './installFont';

export const tools: ToolDefinition[] = [
    listPathsTool,
    navigateTool,
    searchStylesTool,
    readStyleTool,
    editStyleTool,
    searchFontsTool,
    installFontTool
];
