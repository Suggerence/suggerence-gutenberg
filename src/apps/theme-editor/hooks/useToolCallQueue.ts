import { useRef, useCallback, useEffect } from '@wordpress/element';
import { executeTool } from '../tools/utils';
import type { ToolCallMessage } from '../types/message';

export interface QueuedToolCall {
    toolName: string;
    toolInput: Record<string, unknown>;
    toolCallId: string;
    toolMessageId: string;
    conversationId: string;
}

interface ToolExecutionResult {
    toolName: string;
    success: boolean;
    result?: unknown;
    error?: string;
}

interface UseToolCallQueueOptions {
    conversationId: string | null;
    updateMessage: (conversationId: string, messageId: string, updates: Partial<ToolCallMessage>) => void;
    onResultsReady: (results: ToolExecutionResult[]) => void;
}

export const useToolCallQueue = ({
    conversationId,
    updateMessage,
    onResultsReady
}: UseToolCallQueueOptions) => {
    const toolCallQueueRef = useRef<QueuedToolCall[]>([]);

    // Clear queue when conversation changes
    useEffect(() => {
        if (!conversationId) {
            toolCallQueueRef.current = [];
        }
    }, [conversationId]);

    const addToQueue = useCallback((toolCall: QueuedToolCall) => {
        toolCallQueueRef.current.push(toolCall);
    }, []);

    const processQueue = useCallback(async () => {
        const queue = toolCallQueueRef.current;
        if (queue.length === 0) return;

        // Clear the queue immediately to prevent re-processing
        toolCallQueueRef.current = [];

        const results: ToolExecutionResult[] = [];

        // Execute all tools in parallel
        const executionPromises = queue.map(async (queuedTool) => {
            try {
                const executionResult = await executeTool(queuedTool.toolName, queuedTool.toolInput);

                if (executionResult.success) {
                    // Update tool_call message with success status and result
                    updateMessage(queuedTool.conversationId, queuedTool.toolMessageId, {
                        content: {
                            name: queuedTool.toolName,
                            arguments: queuedTool.toolInput,
                            status: 'success' as const,
                            result: executionResult.result
                        }
                    });

                    results.push({
                        toolName: queuedTool.toolName,
                        success: true,
                        result: executionResult.result
                    });
                } else {
                    // Update tool_call message with error status
                    updateMessage(queuedTool.conversationId, queuedTool.toolMessageId, {
                        content: {
                            name: queuedTool.toolName,
                            arguments: queuedTool.toolInput,
                            status: 'error' as const,
                            error: executionResult.error
                        }
                    });

                    results.push({
                        toolName: queuedTool.toolName,
                        success: false,
                        error: executionResult.error
                    });
                }
            } catch (error) {
                console.error('[Theme Editor] Error executing tool:', error);
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';

                // Update tool_call message with error status
                updateMessage(queuedTool.conversationId, queuedTool.toolMessageId, {
                    content: {
                        name: queuedTool.toolName,
                        arguments: queuedTool.toolInput,
                        status: 'error' as const,
                        error: errorMessage
                    }
                });

                results.push({
                    toolName: queuedTool.toolName,
                    success: false,
                    error: errorMessage
                });
            }
        });

        // Wait for all tools to complete
        await Promise.all(executionPromises);

        // Notify that results are ready
        onResultsReady(results);
    }, [updateMessage, onResultsReady]);

    return {
        addToQueue,
        processQueue
    };
};
