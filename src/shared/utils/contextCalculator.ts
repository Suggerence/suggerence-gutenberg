/**
 * Calculate the approximate token count and context usage percentage
 */

const APPROXIMATE_CHARS_PER_TOKEN = 4; // Rough approximation for English text
const MAX_CONTEXT_TOKENS = 8000; // Conservative estimate for most models

/**
 * Calculate approximate token count from text
 */
export function calculateTokenCount(text: string): number {
    if (!text) return 0;
    return Math.ceil(text.length / APPROXIMATE_CHARS_PER_TOKEN);
}

/**
 * Calculate the total context size from various sources
 */
export function calculateContextUsage(params: {
    messages: MCPClientMessage[];
    systemPrompt: string;
    selectedContexts: any[];
    gutenbergContext: any;
}): {
    totalTokens: number;
    percentage: number;
    breakdown: {
        systemPrompt: number;
        messages: number;
        selectedContexts: number;
        gutenbergContext: number;
    };
} {
    const { messages, systemPrompt, selectedContexts, gutenbergContext } = params;

    // Calculate tokens for each component
    const systemPromptTokens = calculateTokenCount(systemPrompt);

    const messagesTokens = messages.reduce((total, message) => {
        return total + calculateTokenCount(message.content || '');
    }, 0);

    const selectedContextsTokens = selectedContexts.reduce((total, context) => {
        let contextText = context.label || '';
        if (context.data) {
            if (context.type === 'post' || context.type === 'page') {
                // Add title, excerpt, and URL
                contextText += context.data.title?.rendered || '';
                contextText += context.data.excerpt?.rendered || '';
                contextText += context.data.link || '';
                contextText += context.data.status || '';
                contextText += context.data.date || '';

                // Add a representation of the full context info that would be sent to AI
                contextText += `URL: ${context.data.link || 'N/A'} Status: ${context.data.status || 'N/A'} Date: ${context.data.date || 'N/A'}`;
                if (context.data.excerpt?.rendered) {
                    const excerpt = context.data.excerpt.rendered.replace(/<[^>]*>/g, '').trim();
                    contextText += ` Excerpt: ${excerpt}`;
                }
            } else if (context.type === 'block') {
                contextText += JSON.stringify(context.data.attributes || {});
                contextText += context.data.name || '';
                contextText += context.data.clientId || '';
            }
        }

        return total + calculateTokenCount(contextText);
    }, 0);

    const gutenbergContextTokens = calculateTokenCount(JSON.stringify(gutenbergContext));

    const totalTokens = systemPromptTokens + messagesTokens + selectedContextsTokens + gutenbergContextTokens;
    const percentage = Math.min(100, Math.round((totalTokens / MAX_CONTEXT_TOKENS) * 100));

    return {
        totalTokens,
        percentage,
        breakdown: {
            systemPrompt: systemPromptTokens,
            messages: messagesTokens,
            selectedContexts: selectedContextsTokens,
            gutenbergContext: gutenbergContextTokens
        }
    };
}

/**
 * Get color for context usage percentage
 */
export function getContextUsageColor(percentage: number): string {
    if (percentage < 50) return '#22c55e'; // Green
    if (percentage < 75) return '#f59e0b'; // Yellow/Orange
    if (percentage < 90) return '#ef4444'; // Red
    return '#dc2626'; // Dark red
}

/**
 * Get warning message based on context usage
 */
export function getContextUsageWarning(percentage: number): string | null {
    if (percentage < 75) return null;
    if (percentage < 90) return 'High context usage - consider removing some context';
    return 'Very high context usage - performance may be affected';
}