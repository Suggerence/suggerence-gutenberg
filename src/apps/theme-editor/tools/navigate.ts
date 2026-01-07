import type { ToolDefinition } from '../types/tool';
import execute from './handlers/navigate';

/**
 * Navigate tool - Navigates to a specific path in the WordPress Site Editor
 */
export const navigateTool: ToolDefinition = {
    name: 'navigate',
    description: 'Navigate to a specific path in the theme editor.',
    inputSchema: {
        type: 'object',
        properties: {
            path: {
                type: 'string',
                description: 'The relative path to navigate to from the current path. It\'s helpful to list the paths first using the list_paths tool.'
            }
        },
        required: ['path']
    },
    outputSchema: {
        type: 'object',
        properties: {
            success: {
                type: 'boolean',
                description: 'Whether the navigation was successful'
            },
            navigatedTo: {
                type: 'string',
                description: 'The path that was navigated to'
            },
        },
        required: ['success', 'navigatedTo']
    },
    execute
};
