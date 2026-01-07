import { useEffect } from '@wordpress/element';
import { nanoid } from 'nanoid';
import { useWebsocketStore } from '../../stores/websocket';
import { useConversationsStore } from '../../stores/conversations';
import { executeTool } from '../../tools/utils';
import type { TextMessage, ToolCallMessage } from '../../types/message';
import { useSendMessage } from '../../hooks/useSendMessage';

export const WebsocketHandler = () => {
    const { sendMessage } = useSendMessage();
    const { addMessageHandler } = useWebsocketStore();
    const { addMessage, updateMessage, getCurrentConversation, currentConversationId } = useConversationsStore();

    useEffect(() => {
        if (!currentConversationId) return;

        const handleMessage = (event: MessageEvent) => {
            try {
                const parsed = JSON.parse(event.data);
                const message: { type: string; data?: { chunk?: string; message?: string; tool_name?: string; input?: Record<string, unknown> }; chunk?: string } = parsed;

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
                        const toolCallId = (message.data as any)?.tool_call_id || nanoid(); // Use provided ID or generate one
                        const conversationId = currentConversationId; // Capture for async operations

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

                        // Execute tool using unified execution utility
                        executeTool(toolName, toolInput as Record<string, unknown>)
                            .then((executionResult) => {
                                if (executionResult.success) {
                                    // Update tool_call message with success status and result
                                    updateMessage(conversationId, toolMessageId, {
                                        content: {
                                            name: toolName,
                                            arguments: toolInput as Record<string, unknown>,
                                            status: 'success' as const,
                                            result: executionResult.result
                                        }
                                    });

                                    // Send result back to server
                                    sendMessage(`Tool ${toolName} executed successfully with result: ${JSON.stringify(executionResult.result)}`, false);
                                } else {
                                    // Update tool_call message with error status
                                    updateMessage(conversationId, toolMessageId, {
                                        content: {
                                            name: toolName,
                                            arguments: toolInput as Record<string, unknown>,
                                            status: 'error' as const,
                                            error: executionResult.error
                                        }
                                    });

                                    // Send error back to server
                                    sendMessage(`Tool ${toolName} executed with error: ${executionResult.error}`, false);
                                }
                            })
                            .catch((error) => {
                                console.error('[Theme Editor] Error executing tool:', error);
                                if (conversationId) {
                                    const errorMessage = error?.message || 'Unknown error';
                                    
                                    // Update tool_call message with error status
                                    updateMessage(conversationId, toolMessageId, {
                                        content: {
                                            name: toolName,
                                            arguments: toolInput as Record<string, unknown>,
                                            status: 'error' as const,
                                            error: errorMessage
                                        }
                                    });

                                    // Send error back to server
                                    sendMessage(`Tool ${toolName} executed with error: ${errorMessage}`, false);
                                }
                            });
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
    }, [currentConversationId, addMessageHandler, addMessage, updateMessage, getCurrentConversation, sendMessage]);

    return null;
};
