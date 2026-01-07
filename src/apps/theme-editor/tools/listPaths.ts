import type { ToolDefinition } from '../types/tool';
import execute from './handlers/listPaths';

/**
 * ListPaths tool - Lists available navigation paths in the WordPress Site Editor
 */
export const listPathsTool: ToolDefinition = {
    name: 'list_paths',
    description: 'List the possible paths to navigate to in the theme editor based on the current path.',
    inputSchema: {
        type: 'object',
        properties: {},
        required: []
    },
    outputSchema: {
        type: 'object',
        properties: {
            currentPath: {
                type: 'string',
                description: 'The current path from the URL query parameter'
            },
            availablePaths: {
                type: 'array',
                items: {
                    type: 'object',
                    properties: {
                        path: {
                            type: 'string',
                            description: 'The navigation path'
                        },
                        label: {
                            type: 'string',
                            description: 'Human-readable label for the path'
                        },
                        type: {
                            type: 'string',
                            description: 'Type of path (template, template-part, etc.)'
                        }
                    }
                },
                description: 'List of available paths to navigate to'
            }
        },
        required: ['currentPath', 'availablePaths']
    },
    execute
};
