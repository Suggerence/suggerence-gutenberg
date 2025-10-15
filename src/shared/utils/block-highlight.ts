import { highlightBlock, unhighlightBlock } from '@/shared/components/BlockSelector/api';


/**
 * Extract client IDs from tool arguments and results
 * Looks for common patterns: clientId, client_id, block_id, id fields
 */
export const extractClientIds = (data: any): string[] => {
    const clientIds: string[] = [];

    const extractFromObject = (obj: any): void => {
        if (!obj || typeof obj !== 'object') return;

        // Check for direct client ID fields
        if (obj.clientId && typeof obj.clientId === 'string') {
            clientIds.push(obj.clientId);
        }
        if (obj.client_id && typeof obj.client_id === 'string') {
            clientIds.push(obj.client_id);
        }
        if (obj.block_id && typeof obj.block_id === 'string') {
            clientIds.push(obj.block_id);
        }
        // Check for 'id' field but only if it looks like a Gutenberg client ID
        // Gutenberg client IDs are UUIDs like: "f3e4d5c6-1234-5678-90ab-cdef12345678"
        if (obj.id && typeof obj.id === 'string' && /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(obj.id)) {
            clientIds.push(obj.id);
        }

        // Recursively check nested objects and arrays
        Object.values(obj).forEach(value => {
            if (typeof value === 'object' && value !== null) {
                if (Array.isArray(value)) {
                    value.forEach(item => extractFromObject(item));
                } else {
                    extractFromObject(value);
                }
            }
        });
    };

    // Handle string data (might be JSON)
    if (typeof data === 'string') {
        try {
            const parsed = JSON.parse(data);
            extractFromObject(parsed);
        } catch {
            // Not JSON, ignore
        }
    } else {
        extractFromObject(data);
    }

    // Remove duplicates
    return [...new Set(clientIds)];
};

/**
 * Extract and highlight blocks persistently from tool data (for confirmations)
 * Returns a cleanup function to remove all highlights
 */
export const highlightBlocksFromToolData = (toolArgs?: any, toolResult?: any): void => {
    const clientIds: string[] = [];

    // Extract from tool arguments
    if (toolArgs) {
        clientIds.push(...extractClientIds(toolArgs));
    }

    // Extract from tool result
    if (toolResult) {
        clientIds.push(...extractClientIds(toolResult));
    }

    // Remove duplicates
    const uniqueClientIds = [...new Set(clientIds)];

    // Highlight blocks persistently
    if (uniqueClientIds.length > 0) {
        uniqueClientIds.forEach(id => highlightBlock(id));
    }
};


/**
 * Remove block highlights from tool data
 */
export const removeBlockHighlightsFromToolData = (toolArgs?: any, toolResult?: any): void => {
    const clientIds: string[] = [];
    
    // Extract from tool arguments
    if (toolArgs) {
        clientIds.push(...extractClientIds(toolArgs));
    }

    // Extract from tool result
    if (toolResult) {
        clientIds.push(...extractClientIds(toolResult));
    }

    // Remove duplicates
    const uniqueClientIds = [...new Set(clientIds)];

    // Remove block highlights
    if (uniqueClientIds.length > 0) {
        uniqueClientIds.forEach(id => unhighlightBlock(id));
    }
};

