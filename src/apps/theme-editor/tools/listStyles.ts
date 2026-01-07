import type { ToolDefinition } from '../types/tool';
import execute from './handlers/listStyles';

/**
 * ListStyles tool - Lists available styles in the WordPress Site Editor
 */
export const listStylesTool: ToolDefinition = {
    name: 'list_styles',
    description: 'List the available styles in the theme editor. They are returned in a list of dot separated paths.',
    inputSchema: {
        type: 'object',
        properties: {},
        required: []
    },
    outputSchema: {
        type: 'object',
        properties: {
            styles: {
                type: 'array',
                items: {
                    type: 'string',
                    description: 'The style path. Example: "color.background"'
                },
                description: 'List of available styles'
            }
        },
        required: ['styles']
    },
    execute
};
