import type { ToolDefinition } from '../types/tool';
import execute from './handlers/readStyle';

/**
 * ReadStyle tool - Reads the content of a style file in the theme editor
 */
export const readStyleTool: ToolDefinition = {
    name: 'read_style',
    description: 'Read the content of a style file in the theme editor. The style\'s current value origin is also returned, to know if it comes from the AI\'s suggestions, the user\'s configuration or the theme\'s default value.',
    inputSchema: {
        type: 'object',
        properties: {
            path: {
                type: 'string',
                description: 'The path to the style file to read. It\'s helpful to list the styles first using the list_styles tool.'
            },
            block: {
                type: 'string',
                description: 'If set, returns the style for the specific given block. Use the block\'s slug like "core/paragraph" or "core/heading" etc.'
            },
            var_value: {
                type: 'boolean',
                description: 'Defaults to true. If set to false, returns the style\'s actual value, and not the wordpress variable setup for the style.'
            }
        },
        required: ['path']
    },
    outputSchema: {
        type: 'object',
        properties: {
            value: {
                type: 'string',
                description: 'The style value'
            },
            origin: {
                type: 'string',
                description: 'The origin of the style value: "ai", "user", or "theme"',
                enum: ['ai', 'user', 'theme']
            }
        },
        required: ['value', 'origin']
    },
    execute
};
