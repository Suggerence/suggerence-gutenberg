import type { ToolDefinition } from '../types/tool';
import execute from './handlers/searchStyles';

/**
 * SearchStyles tool - Searches for styles in the theme editor
 */
export const searchStylesTool: ToolDefinition = {
    name: 'search_styles',
    description: 'Search for styles in the theme editor given a search query like \'background\', \'font\', \'color\', etc. They are returned in a list of dot separated paths and current values.',
    inputSchema: {
        type: 'object',
        properties: {
            query: {
                type: 'string',
                description: 'The search query like \'background\', \'font\', \'color\', etc.'
            }
        },
        required: ['query']
    },
    outputSchema: {
        type: 'object',
        properties: {
            styles: {
                type: 'array',
                items: {
                    type: 'object',
                    properties: {
                        path: {
                            type: 'string',
                            description: 'The style path. Example: "color.background"'
                        },
                        value: {
                            type: 'string',
                            description: 'The style\'s current value'
                        }
                    }
                }
            }
        },
        required: ['styles']
    },
    execute
};