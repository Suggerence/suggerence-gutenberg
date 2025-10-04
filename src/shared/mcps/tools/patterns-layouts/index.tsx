import { dispatch, select } from '@wordpress/data';
import { parse } from '@wordpress/blocks';

export const searchPatternTool: SuggerenceMCPResponseTool = {
    name: 'search_pattern',
    description: 'Searches for available WordPress block patterns by keyword or category. Block patterns are pre-designed layouts combining multiple blocks (like hero sections, pricing tables, testimonials, call-to-actions, team grids, etc.). Use this to discover what patterns are available before inserting one. Patterns are registered by WordPress core, the active theme, and installed plugins.',
    inputSchema: {
        type: 'object',
        properties: {
            search: {
                type: 'string',
                description: 'Search term to filter patterns by name or keywords. Examples: "hero", "pricing", "testimonial", "team", "cta", "gallery", "header", "footer". Leave empty to see all patterns.'
            },
            category: {
                type: 'string',
                description: 'Filter by pattern category slug. Common categories: "header", "footer", "hero", "call-to-action", "testimonials", "team", "portfolio", "pricing", "featured", "text", "buttons", "columns", "gallery". Leave empty to search all categories.'
            }
        }
    }
};

export const insertPatternTool: SuggerenceMCPResponseTool = {
    name: 'insert_pattern',
    description: 'Inserts a pre-designed WordPress block pattern into the editor. Block patterns are ready-made layouts that combine multiple blocks (hero sections, pricing tables, testimonials, etc.). Use the search pattern tool first to find the pattern name you want to insert. The pattern will be inserted as actual blocks that can be edited individually.',
    inputSchema: {
        type: 'object',
        properties: {
            patternName: {
                type: 'string',
                description: 'The exact name/slug of the pattern to insert (e.g., "core/query-standard-posts", "twentytwentyfour/hero", "theme/pricing-table"). Use the search pattern tool to find available pattern names.',
                required: true
            },
            position: {
                type: 'string',
                description: 'Where to insert the pattern. "before" inserts above the selected block, "after" inserts below it, "end" appends to the bottom of the document. Defaults to "after".',
                enum: ['before', 'after', 'end']
            },
            targetBlockId: {
                type: 'string',
                description: 'The client ID of the reference block for positioning. If not provided, uses the currently selected block in the editor.'
            }
        },
        required: ['patternName']
    }
};

/**
 * Search for available block patterns
 */
export function searchPattern(args: {
    search?: string;
    category?: string;
}): { content: Array<{ type: string, text: string }> } {
    try {
        const { __experimentalGetAllowedPatterns, getSettings } = select('core/block-editor') as any;
        const { __experimentalBlockPatterns, __experimentalBlockPatternCategories } = getSettings();
        
        // Get all patterns
        let patterns = __experimentalBlockPatterns || [];
        
        // Try alternative method if first doesn't work
        if (patterns.length === 0 && __experimentalGetAllowedPatterns) {
            patterns = __experimentalGetAllowedPatterns() || [];
        }

        if (patterns.length === 0) {
            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify({
                        success: false,
                        action: 'search_pattern_failed',
                        error: 'No block patterns available. Patterns are provided by your theme and plugins.',
                        totalPatterns: 0,
                        patterns: []
                    })
                }]
            };
        }

        // Filter by category if provided
        if (args.category) {
            patterns = patterns.filter((pattern: any) => {
                return pattern.categories?.includes(args.category);
            });
        }

        // Filter by search term if provided
        if (args.search) {
            const searchLower = args.search.toLowerCase();
            patterns = patterns.filter((pattern: any) => {
                const nameMatch = pattern.name?.toLowerCase().includes(searchLower);
                const titleMatch = pattern.title?.toLowerCase().includes(searchLower);
                const descriptionMatch = pattern.description?.toLowerCase().includes(searchLower);
                const keywordsMatch = pattern.keywords?.some((keyword: string) => 
                    keyword.toLowerCase().includes(searchLower)
                );
                return nameMatch || titleMatch || descriptionMatch || keywordsMatch;
            });
        }

        // Format pattern information
        const formattedPatterns = patterns.map((pattern: any) => ({
            name: pattern.name,
            title: pattern.title,
            description: pattern.description || '',
            categories: pattern.categories || [],
            keywords: pattern.keywords || [],
            viewportWidth: pattern.viewportWidth,
            blockTypes: pattern.blockTypes || []
        }));

        // Get category information
        const categories = __experimentalBlockPatternCategories || [];
        const categoryMap = categories.reduce((acc: any, cat: any) => {
            acc[cat.name] = cat.label;
            return acc;
        }, {});

        return {
            content: [{
                type: 'text',
                text: JSON.stringify({
                    success: true,
                    action: 'patterns_found',
                    data: {
                        totalPatterns: formattedPatterns.length,
                        patterns: formattedPatterns,
                        availableCategories: categories.map((cat: any) => ({
                            name: cat.name,
                            label: cat.label
                        })),
                        searchTerm: args.search || null,
                        category: args.category || null
                    }
                }, null, 2)
            }]
        };
    } catch (error) {
        return {
            content: [{
                type: 'text',
                text: JSON.stringify({
                    success: false,
                    action: 'search_pattern_failed',
                    error: `Error searching patterns: ${error instanceof Error ? error.message : 'Unknown error'}`
                })
            }]
        };
    }
}

/**
 * Insert a block pattern into the editor
 * Uses WordPress's built-in pattern transformation if available, otherwise falls back to manual insertion
 */
export function insertPattern(args: {
    patternName: string;
    position?: string;
    targetBlockId?: string;
}): { content: Array<{ type: string, text: string }> } {
    try {
        const blockEditorSelect = select('core/block-editor') as any;
        const blockEditorDispatch = dispatch('core/block-editor') as any;
        
        const { getSettings, getSelectedBlockClientId, getBlockIndex, getBlocks } = blockEditorSelect;
        const { insertBlocks, replaceBlocks } = blockEditorDispatch;
        
        // Try multiple methods to get patterns
        let pattern: any = null;
        let patterns: any[] = [];

        // Method 1: Get from settings
        const settings = getSettings();
        if (settings.__experimentalBlockPatterns) {
            patterns = settings.__experimentalBlockPatterns;
            pattern = patterns.find((p: any) => p.name === args.patternName);
        }

        // Method 2: Try using __experimentalGetAllowedPatterns
        if (!pattern && blockEditorSelect.__experimentalGetAllowedPatterns) {
            patterns = blockEditorSelect.__experimentalGetAllowedPatterns() || [];
            pattern = patterns.find((p: any) => p.name === args.patternName);
        }

        // Method 3: Try core/blocks store
        if (!pattern) {
            try {
                const blocksSelect = select('core/blocks') as any;
                if (blocksSelect && blocksSelect.getPatterns) {
                    patterns = blocksSelect.getPatterns() || [];
                    pattern = patterns.find((p: any) => p.name === args.patternName);
                }
            } catch (e) {
                console.warn('Could not access core/blocks store:', e);
            }
        }

        if (!pattern) {
            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify({
                        success: false,
                        action: 'insert_pattern_failed',
                        error: `Pattern "${args.patternName}" not found. Available patterns: ${patterns.length}. Use the search pattern tool to find available patterns.`,
                        debug: {
                            searched_pattern: args.patternName,
                            total_patterns_found: patterns.length,
                            pattern_names: patterns.slice(0, 10).map((p: any) => p.name),
                            available_dispatch_actions: Object.keys(blockEditorDispatch).filter(k => k.includes('attern') || k.includes('nsert'))
                        }
                    })
                }]
            };
        }

        // Validate pattern has content
        if (!pattern.content) {
            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify({
                        success: false,
                        action: 'insert_pattern_failed',
                        error: `Pattern "${args.patternName}" has no content to insert.`,
                        debug: {
                            pattern_structure: Object.keys(pattern)
                        }
                    })
                }]
            };
        }

        // Check if there's a built-in insertPattern action
        if (blockEditorDispatch.insertPattern) {
            // Use the built-in pattern insertion if available
            try {
                blockEditorDispatch.insertPattern(pattern, args.targetBlockId);
                return {
                    content: [{
                        type: 'text',
                        text: JSON.stringify({
                            success: true,
                            action: 'pattern_inserted',
                            method: 'built-in-insertPattern',
                            data: {
                                pattern_name: args.patternName,
                                pattern_title: pattern.title
                            }
                        })
                    }]
                };
            } catch (insertError) {
                console.warn('Built-in insertPattern failed, falling back to manual insertion:', insertError);
            }
        }

        // Fallback: Parse the pattern content into blocks manually
        const blocks = parse(pattern.content);

        if (!blocks || blocks.length === 0) {
            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify({
                        success: false,
                        action: 'insert_pattern_failed',
                        error: `Pattern "${args.patternName}" could not be parsed into blocks.`,
                        debug: {
                            pattern_content_length: pattern.content?.length,
                            pattern_content_preview: pattern.content?.substring(0, 200)
                        }
                    })
                }]
            };
        }

        // Determine insertion position
        const selectedBlockId = args.targetBlockId || getSelectedBlockClientId();
        let index: number | undefined;

        if (args.position?.toLowerCase() === 'before' && selectedBlockId) {
            index = getBlockIndex(selectedBlockId);
        } else if (args.position?.toLowerCase() === 'after' && selectedBlockId) {
            index = getBlockIndex(selectedBlockId) + 1;
        } else if (args.position?.toLowerCase() === 'end') {
            index = undefined; // Append to end
        } else {
            // Default: after current block or at end
            index = selectedBlockId ? getBlockIndex(selectedBlockId) + 1 : undefined;
        }

        // Insert the blocks
        insertBlocks(blocks, index);

        return {
            content: [{
                type: 'text',
                text: JSON.stringify({
                    success: true,
                    action: 'pattern_inserted',
                    method: 'manual-parse-and-insert',
                    data: {
                        pattern_name: args.patternName,
                        pattern_title: pattern.title,
                        blocks_inserted: blocks.length,
                        block_types: blocks.map((b: any) => b.name),
                        position: args.position || 'after',
                        index: index
                    }
                })
            }]
        };
    } catch (error) {
        return {
            content: [{
                type: 'text',
                text: JSON.stringify({
                    success: false,
                    action: 'insert_pattern_failed',
                    error: `Error inserting pattern: ${error instanceof Error ? error.message : 'Unknown error'}`,
                    stack: error instanceof Error ? error.stack : undefined
                })
            }]
        };
    }
}

