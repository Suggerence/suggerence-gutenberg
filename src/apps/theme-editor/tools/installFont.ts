import type { ToolDefinition } from '../types/tool';
import execute from './handlers/installFont';

/**
 * InstallFont tool - Installs a font given a slug
 */
export const installFontTool: ToolDefinition = {
    name: 'install_font',
    description: 'Install a font given a slug. The slug is the font family slug. It\'s helpful to search for fonts first using the search_fonts tool.',
    inputSchema: {
        type: 'object',
        properties: {
            slug: {
                type: 'string',
                description: 'The font family slug. It\'s helpful to search for fonts first using the search_fonts tool.'
            }
        },
        required: ['slug']
    },
    outputSchema: {
        type: 'object',
        properties: {
            success: {
                type: 'boolean',
                description: 'Whether the font was installed successfully'
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