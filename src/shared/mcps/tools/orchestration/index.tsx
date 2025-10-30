/**
 * Orchestration Tools for Multi-Agent System
 *
 * Implements Anthropic's orchestrator-worker pattern for parallel task execution
 * The orchestrator delegates specialized tasks to subagents running in parallel
 */

export const spawnSubagentTool: SuggerenceMCPResponseTool = {
    name: 'spawn_subagent',
    description: 'Creates specialized subagents to handle specific tasks in parallel. Use this for COMPLEX requests that can be broken into independent subtasks (like creating full page layouts, multiple images, or comprehensive content sections). DO NOT use for simple single operations. Each subagent runs independently with focused tools and returns results to you for synthesis. Types: layout_researcher (finds patterns/structure), content_creator (generates text/images)', //, block_executor (creates blocks), style_designer (applies styling).
    inputSchema: {
        type: 'object',
        properties: {
            subagents: {
                type: 'array',
                description: 'Array of subagent tasks to execute in parallel. Each subagent will work independently and return results.',
                items: {
                    type: 'object',
                    properties: {
                        agent_type: {
                            type: 'string',
                            description: 'Type of specialized subagent to spawn.',
                            enum: ['layout_researcher', 'content_creator'] //, 'block_executor', 'style_designer'
                        },
                        task_description: {
                            type: 'string',
                            description: 'Clear, specific task for this subagent to accomplish. Be explicit about what you need back (e.g., "Find a hero pattern with image support", "Generate 3 feature descriptions", "Create color scheme based on brand").'
                        },
                        context: {
                            type: 'object',
                            description: 'Relevant context from the current document/request that this subagent needs (selected blocks, user preferences, existing content, etc.).',
                            additionalProperties: true
                        }
                    },
                    required: ['agent_type', 'task_description']
                }
            }
        },
        required: ['subagents']
    }
};

/**
 * Tool definitions for each specialized subagent type
 * Each subagent gets only the tools relevant to its role
 */
export const SUBAGENT_TOOL_SETS = {
    layout_researcher: [
        'search_pattern',
        'get_available_blocks',
        'get_block_schema'
    ],
    content_creator: [
        'generate_image',
        'search_openverse',
        'upload_openverse_to_media',
        'search_media'
    ],
    block_executor: [
        'add_block',
        'update_block',
        'get_block_schema',
        'insert_pattern'
    ],
    style_designer: [
        'update_block',
        'get_block_schema'
    ]
} as const;

/**
 * System prompts for each subagent type
 */
export const SUBAGENT_SYSTEM_PROMPTS = {
    layout_researcher: `You are a Layout Research Specialist for WordPress Gutenberg.

Your role:
- Search for and evaluate block patterns that match user requirements
- Identify the best block types for specific layouts
- Understand block schemas to recommend optimal structures
- Provide detailed recommendations on layout approach

You have access to:
- search_pattern: Find pre-built patterns
- get_available_blocks: See all block types
- get_block_schema: Understand block capabilities

Your response should include:
- Pattern recommendations with names
- Block type suggestions
- Structural approach (columns, groups, etc.)
- Reasoning for your recommendations

Be thorough but concise. Focus on actionable recommendations.`,

    content_creator: `You are a Content Creation Specialist for WordPress.

Your role:
- Generate or find images based on user requirements
- Search for appropriate stock photography
- Create visual content that matches the desired style
- Return media IDs and URLs ready for block insertion

You have access to:
- generate_image: Create AI images from descriptions
- search_openverse: Find free stock photos
- upload_openverse_to_media: Import stock photos to media library
- search_media: Find existing media in the library

Your response should include:
- Media IDs of uploaded/generated images
- Image URLs
- Alt text and descriptions
- Reasoning for media choices

Prioritize Openverse stock photos when possible (faster, free).
Only generate AI images if suitable stock photos aren't available.`,

    block_executor: `You are a Block Execution Specialist for WordPress Gutenberg.

Your role:
- Create blocks with correct schemas and attributes
- Insert patterns into the document
- Execute the actual block operations
- Ensure technical correctness

You have access to:
- add_block: Create new blocks
- update_block: Modify existing blocks
- get_block_schema: Check block requirements
- insert_pattern: Add pre-built patterns

CRITICAL: Always call get_block_schema BEFORE creating/updating blocks.

Your response should include:
- Block IDs of created blocks
- Success/failure status of each operation
- Any technical issues encountered

Be precise with block attributes and structure.`,

    style_designer: `You are a Styling Specialist for WordPress Gutenberg.

Your role:
- Apply visual styling to blocks (colors, spacing, borders, typography)
- Ensure visual consistency across blocks
- Use WordPress theme.json-compatible style objects
- Create cohesive visual designs

You have access to:
- update_block: Apply styles to blocks
- get_block_schema: Check supported style properties

CRITICAL: Always call get_block_schema BEFORE styling to see supported properties.

Your response should include:
- Applied styles with reasoning
- Block IDs that were styled
- Visual approach and theme

Use style objects properly:
- style.color.background, style.color.text
- style.spacing.padding, style.spacing.margin
- style.border.radius, style.border.color
- style.typography.fontSize, style.typography.fontWeight

Be thoughtful about visual harmony.`
} as const;

/**
 * Spawn and execute subagents in parallel
 * This function is called by the orchestrator agent
 *
 * Note: This is a placeholder that returns immediately.
 * The actual parallel execution happens in the backend WebSocket handler,
 * which intercepts spawn_subagent calls and executes subagents via Claude API.
 */
export async function spawnSubagent(args: {
    subagents: Array<{
        agent_type: keyof typeof SUBAGENT_TOOL_SETS;
        task_description: string;
        context?: Record<string, any>;
    }>;
}): Promise<{ content: Array<{ type: string, text: string }> }> {
    try {
        // Validate subagent types
        const invalidTypes = args.subagents.filter(
            sa => !Object.keys(SUBAGENT_TOOL_SETS).includes(sa.agent_type)
        );

        if (invalidTypes.length > 0) {
            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify({
                        success: false,
                        action: 'spawn_subagent_failed',
                        error: `Invalid subagent types: ${invalidTypes.map(t => t.agent_type).join(', ')}`
                    })
                }]
            };
        }

        // This is just a placeholder response
        // The backend will intercept this tool call and execute subagents in parallel
        // Then return the actual results
        return {
            content: [{
                type: 'text',
                text: JSON.stringify({
                    success: true,
                    action: 'subagents_spawning',
                    data: {
                        subagent_count: args.subagents.length,
                        message: 'Subagents are being spawned in parallel by the backend...'
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
                    action: 'spawn_subagent_failed',
                    error: `Error spawning subagents: ${error instanceof Error ? error.message : 'Unknown error'}`
                })
            }]
        };
    }
}
