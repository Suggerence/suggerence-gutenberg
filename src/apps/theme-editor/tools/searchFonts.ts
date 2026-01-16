import type { ToolDefinition } from '../types/tool';
import execute from './handlers/searchFonts';

/**
 * SearchFonts tool - Searches for fonts in the theme editor
 */
export const searchFontsTool: ToolDefinition = {
    name: 'search_fonts',
    description: 'Search for available fonts given a search query like \'arial\', \'sans-serif\', \'serif\', etc. They are returned in a list with the font family name, slug, font family, and if it is installed or not.',
    inputSchema: {
        type: 'object',
        properties: {
            query: {
                type: 'string',
                description: 'The search query. Can be a font family name or a part of it like \'sans-serif\', \'serif\', etc.'
            }
        },
        required: ['query']
    },
    outputSchema: {
        type: 'object',
        properties: {
            fonts: {
                type: 'array',
                items: {
                    type: 'object',
                    properties: {
                        name: {
                            type: 'string',
                            description: 'The font family name'
                        },
                        slug: {
                            type: 'string',
                            description: 'The font family slug. Used for installing the font.'
                        },
                        fontFamily: {
                            type: 'string',
                            description: 'The font family name'
                        },
                        installed: {
                            type: 'boolean',
                            description: 'Whether the font is installed or not'
                        }
                    }
                }
            }
        },
        required: ['fonts']
    },
    execute
};