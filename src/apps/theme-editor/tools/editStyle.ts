import type { ToolDefinition } from '../types/tool';
import execute from './handlers/editStyle';

/**
 * EditStyle tool - Edits a style value in the theme editor
 */
export const editStyleTool: ToolDefinition = {
    name: 'edit_style',
    description: 'Edit a style value in the theme editor. Updates the style at the specified path with the given value.',
    inputSchema: {
        type: 'object',
        properties: {
            path: {
                type: 'string',
                description: 'The path to the style to edit. It\'s helpful to list the styles first using the list_styles tool.'
            },
            value: {
                type: 'string',
                description: 'The new value to set for the style'
            },
            block: {
                type: 'string',
                description: 'If set, edits the style for the specific given block. Use the block\'s slug like "core/paragraph" or "core/heading" etc.'
            }
        },
        required: ['path', 'value']
    },
    outputSchema: {
        type: 'object',
        properties: {
            success: {
                type: 'boolean',
                description: 'Whether the edit was successful'
            },
            message: {
                type: 'string',
                description: 'A message describing the result of the operation'
            }
        },
        required: ['success']
    },
    execute
};
