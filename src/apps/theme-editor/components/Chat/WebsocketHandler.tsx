import { useEffect, useCallback } from '@wordpress/element';
import { nanoid } from 'nanoid';
import { useWebsocketStore } from '../../stores/websocket';
import { useConversationsStore } from '../../stores/conversations';
import type { TextMessage, ToolCallMessage } from '../../types/message';
import { useSendMessage } from '../../hooks/useSendMessage';
import { useToolCallQueue, type QueuedToolCall } from '../../hooks/useToolCallQueue';

export const WebsocketHandler = () => {
    const { sendMessage } = useSendMessage();
    const { addMessageHandler } = useWebsocketStore();
    const { addMessage, updateMessage, getCurrentConversation, currentConversationId } = useConversationsStore();

    // Callback to format and send consolidated tool results
    const handleResultsReady = useCallback((results: Array<{ toolName: string; success: boolean; result?: unknown; error?: string }>) => {
        const toolNames = results.map(r => r.toolName).join(', ');
        const successResults = results.filter(r => r.success);
        const errorResults = results.filter(r => !r.success);

        let resultMessage = `Tools ${toolNames} executed. `;
        
        if (successResults.length > 0) {
            const successDetails = successResults.map(r => 
                `${r.toolName}: ${JSON.stringify(r.result)}`
            ).join('; ');
            resultMessage += `Received response(s): ${successDetails}`;
        }
        
        if (errorResults.length > 0) {
            const errorDetails = errorResults.map(r => 
                `${r.toolName}: ${r.error}`
            ).join('; ');
            resultMessage += (successResults.length > 0 ? '; ' : '') + `Errors: ${errorDetails}`;
        }

        sendMessage(resultMessage, false);
    }, [sendMessage]);

    const { addToQueue, processQueue } = useToolCallQueue({
        conversationId: currentConversationId,
        updateMessage,
        onResultsReady: handleResultsReady
    });

    useEffect(() => {
        if (!currentConversationId) return;

        const handleMessage = (event: MessageEvent) => {
            try {
                const parsed = JSON.parse(event.data);
                const message: { type: string; data?: { chunk?: string; message?: string; tool_name?: string; input?: Record<string, unknown>; tool_call_id?: string }; chunk?: string } = parsed;

                const conversation = getCurrentConversation();
                if (!conversation) return;

                switch (message.type) {
                    case 'text_delta': {
                        const chunk = message.chunk || message.data?.chunk || '';
                        const lastMessage = conversation.messages[conversation.messages.length - 1];
                        
                        if (lastMessage && lastMessage.type === 'response') {
                            // Update existing response message
                            updateMessage(currentConversationId, lastMessage.id, {
                                content: {
                                    text: (lastMessage.content.text || '') + chunk
                                }
                            });
                        } else {
                            // Create new response message
                            const responseMessage: TextMessage = {
                                id: nanoid(),
                                createdAt: new Date().toISOString(),
                                type: 'response',
                                content: {
                                    text: chunk
                                }
                            };
                            addMessage(currentConversationId, responseMessage);
                        }
                        break;
                    }

                    case 'error': {
                        const errorText = message.data?.message || 'An error occurred';
                        const errorMessage: TextMessage = {
                            id: nanoid(),
                            createdAt: new Date().toISOString(),
                            type: 'response',
                            content: {
                                text: `Error: ${errorText}`
                            }
                        };
                        addMessage(currentConversationId, errorMessage);
                        break;
                    }

                    case 'tool_call': {
                        const toolName = message.data?.tool_name || '';
                        const toolInput = message.data?.input || {};
                        const toolCallId = message.data?.tool_call_id || nanoid();
                        const conversationId = currentConversationId;

                        if (!toolName || !toolInput) {
                            console.error('[Theme Editor] Tool call message missing required fields');
                            break;
                        }

                        if (!conversationId) {
                            console.error('[Theme Editor] No active conversation for tool call');
                            break;
                        }

                        // Add tool_call message with pending status
                        const toolCallMessage: ToolCallMessage = {
                            id: nanoid(),
                            createdAt: new Date().toISOString(),
                            type: 'tool_call',
                            content: {
                                name: toolName,
                                arguments: toolInput as Record<string, unknown>,
                                status: 'pending'
                            }
                        };
                        const toolMessageId = toolCallMessage.id;
                        addMessage(conversationId, toolCallMessage);

                        // Queue the tool call instead of executing immediately
                        addToQueue({
                            toolName,
                            toolInput: toolInput as Record<string, unknown>,
                            toolCallId,
                            toolMessageId,
                            conversationId
                        });
                        break;
                    }

                    case 'finish': {
                        // Process all queued tool calls when stream finishes
                        processQueue();
                        break;
                    }

                    default:
                        console.log('[Theme Editor] Unhandled WebSocket message type:', message.type);
                }
            } catch (error) {
                console.error('[Theme Editor] Error parsing WebSocket message:', error);
            }
        };

        const cleanup = addMessageHandler(handleMessage);
        return cleanup;
    }, [currentConversationId, addMessageHandler, addMessage, updateMessage, getCurrentConversation, addToQueue, processQueue]);

    return null;
};
