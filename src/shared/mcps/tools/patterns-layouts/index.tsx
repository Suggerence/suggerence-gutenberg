import { dispatch, select } from '@wordpress/data';
import { parse } from '@wordpress/blocks';

/**
 * Get available pattern categories from WordPress
 */
function getAvailablePatternCategories(): string[] {
    try {
        const blocksSelect = select('core/blocks') as any;
        const blockEditorSelect = select('core/block-editor') as any;
        
        let categories: any[] = [];

        // Try to get categories from core/blocks store
        if (blocksSelect?.getPatternCategories) {
            categories = blocksSelect.getPatternCategories() || [];
        }

        // Fallback to block-editor settings
        if (categories.length === 0 && blockEditorSelect) {
            const settings = blockEditorSelect.getSettings?.();
            if (settings?.__experimentalBlockPatternCategories) {
                categories = settings.__experimentalBlockPatternCategories || [];
            }
        }

        return categories.map((cat: any) => cat.name).filter(Boolean);
    } catch (error) {
        console.warn('Could not fetch pattern categories:', error);
        return [];
    }
}

/**
 * Generate search pattern tool with dynamic category enum
 * This function is called when listing tools to ensure the category enum
 * contains the actual available categories from the current WordPress installation.
 * Categories are dynamic and depend on the active theme and installed plugins.
 */
export function SearchPatternTool(): SuggerenceMCPResponseTool {
    const availableCategories = getAvailablePatternCategories();

    return {
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
                    description: 'Filter by pattern category slug. Leave empty to search all categories.',
                    ...(availableCategories.length > 0 ? { enum: availableCategories } : {})
                }
            }
        }
    };
}

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
        const blockEditorSelect = select('core/block-editor') as any;

        let patterns: any[] = [];
        let categories: any[] = [];

        // Get settings first (needed for categories)
        const settings = blockEditorSelect?.getSettings?.();

        // Get patterns using the same method as Gutenberg
        if (blockEditorSelect?.__experimentalGetAllowedPatterns) {
            try {
                // Call with rootClientId = undefined to get all patterns (same as Gutenberg)
                patterns = blockEditorSelect.__experimentalGetAllowedPatterns(undefined) || [];
            } catch (e) {
                console.warn('__experimentalGetAllowedPatterns failed:', e);
            }
        }

        // Fallback: Get patterns from settings if the method above failed
        if (patterns.length === 0 && settings?.__experimentalBlockPatterns) {
            patterns = settings.__experimentalBlockPatterns || [];
        }

        // Get categories from settings (same as Gutenberg)
        if (settings) {
            const allCategories = [
                ...(settings.__experimentalBlockPatternCategories || []),
                ...(settings.__experimentalUserPatternCategories || [])
            ];
            // Remove duplicates by category name
            const categoryMap = new Map();
            allCategories.forEach(cat => {
                if (!categoryMap.has(cat.name)) {
                    categoryMap.set(cat.name, cat);
                }
            });
            categories = Array.from(categoryMap.values());
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
                        patterns: [],
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

        // Filter by search term if provided (like Gutenberg's inserter)
        if (args.search) {
            const normalizedSearch = args.search.toLowerCase().trim();
            const beforeFilterCount = patterns.length;

            patterns = patterns.filter((pattern: any) => {
                // Combine searchable text (without content to keep it lightweight)
                const searchableText = [
                    pattern.name || '',
                    pattern.title || '',
                    pattern.description || '',
                    ...(pattern.keywords || []),
                    ...(pattern.categories || [])
                ].join(' ').toLowerCase();

                const matches = searchableText.includes(normalizedSearch);

                return matches;
            });

            console.log(`Search filter: ${beforeFilterCount} -> ${patterns.length} patterns for search "${normalizedSearch}"`);
        }

        // Format pattern information
        const formattedPatterns = patterns.map((pattern: any) => ({
            name: pattern.name,
            title: pattern.title,
            description: pattern.description || '',
            categories: pattern.categories || [],
            keywords: pattern.keywords || [],
            viewportWidth: pattern.viewportWidth,
            blockTypes: pattern.blockTypes || [],
            inserter: pattern.inserter !== false // Whether it appears in the inserter
        }));

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
                            label: cat.label,
                            description: cat.description || ''
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
                    error: `Error searching patterns: ${error instanceof Error ? error.message : 'Unknown error'}`,
                    stack: error instanceof Error ? error.stack : undefined
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
        
        // Try multiple methods to get patterns (prefer core/blocks store)
        let pattern: any = null;
        let patterns: any[] = [];

        // Method 1: Try core/blocks store (primary, most comprehensive)
        const blocksSelect = select('core/blocks') as any;
        if (blocksSelect) {
            // Try getAllPatterns first
            if (blocksSelect.getAllPatterns) {
                patterns = blocksSelect.getAllPatterns() || [];
                pattern = patterns.find((p: any) => p.name === args.patternName);
            }
            // Fallback to getPatterns
            if (!pattern && blocksSelect.getPatterns) {
                patterns = blocksSelect.getPatterns() || [];
                pattern = patterns.find((p: any) => p.name === args.patternName);
            }
        }

        // Method 2: Try using __experimentalGetAllowedPatterns from core/block-editor
        if (!pattern && blockEditorSelect.__experimentalGetAllowedPatterns) {
            patterns = blockEditorSelect.__experimentalGetAllowedPatterns() || [];
            pattern = patterns.find((p: any) => p.name === args.patternName);
        }

        // Method 3: Get from block-editor settings
        if (!pattern) {
            const settings = getSettings();
            if (settings.__experimentalBlockPatterns) {
                patterns = settings.__experimentalBlockPatterns;
                pattern = patterns.find((p: any) => p.name === args.patternName);
            }
        }

        if (!pattern) {
            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify({
                        success: false,
                        action: 'insert_pattern_failed',
                        error: `Pattern "${args.patternName}" not found.`,
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
                        error: `Pattern "${args.patternName}" could not be parsed into blocks.`
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

