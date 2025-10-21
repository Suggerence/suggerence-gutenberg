import { convertImageUrlToBase64 } from "../utils/image-utils";
import { useWebSocket } from "../context/WebSocketContext";

export const useBaseAIWebSocket = (config: UseBaseAIConfig): UseBaseAIReturn => {
    const { isConnected, sendRequest } = useWebSocket();

    const callAI = async (
        messages: MCPClientMessage[],
        model: AIModel | null,
        tools: SuggerenceMCPResponseTool[],
        abortSignal?: AbortSignal,
        onStreamChunk?: (chunk: { type: string; content: string; accumulated: string }) => void
    ): Promise<MCPClientMessage> => {
        // Find the most recent reasoning message (if any)
        // BUT only if the last message is NOT a new user message
        let currentReasoning: ReasoningContent | undefined = undefined;

        // Check if the last message is a new user message (indicating a fresh request)
        const lastMessage = messages[messages.length - 1];
        const isNewUserRequest = lastMessage?.role === 'user';

        // Only use existing reasoning if we're continuing a conversation (not a new user request)
        if (!isNewUserRequest) {
            for (let i = messages.length - 1; i >= 0; i--) {
                if (messages[i].role === 'reasoning' && (messages[i] as any).reasoning) {
                    currentReasoning = (messages[i] as any).reasoning;
                    break;
                }
            }
        }

        // Get comprehensive site context using the provided function
        const siteContext = config.getSiteContext();

        // Add current reasoning to the site context
        const siteContextWithReasoning = {
            ...siteContext,
            currentReasoning
        };

        // Get system prompt using the provided function (which now has access to currentReasoning)
        const systemPrompt = config.getSystemPrompt(siteContextWithReasoning);

        // Log original messages before conversion
        console.log('📥 Original messages before conversion:', JSON.stringify(messages.map(m => ({
            role: m.role,
            content: m.content?.substring(0, 50) + (m.content?.length > 50 ? '...' : ''),
            loading: (m as any).loading,
            thinking: (m as any).role === 'thinking' ? 'yes' : 'no',
            toolName: (m as any).toolName
        })), null, 2));

        // Check if we have visual contexts for the current conversation
        const visualContexts = siteContext.selectedContexts?.filter((ctx: any) => {
            const isDrawing = ctx.type === 'drawing';
            const isImage = ctx.type === 'image';
            const isImageBlock = ctx.type === 'block' && (ctx.data?.name === 'core/image' || ctx.data?.name === 'core/cover');

            return isDrawing || isImage || isImageBlock;
        }) || [];

        let convertedMessages;
        if (visualContexts.length > 0) {
            // Find the latest user message to attach images to
            let latestUserMessageIndex = -1;
            for (let i = messages.length - 1; i >= 0; i--) {
                if (messages[i].role === 'user') {
                    latestUserMessageIndex = i;
                    break;
                }
            }

            convertedMessages = await Promise.all(messages.map(async (message, index) => {
                // Skip tool_confirmation, reasoning, and thinking messages - they're UI only
                if (message.role === 'tool_confirmation' || message.role === 'thinking') {
                    return null;
                }

                if (index === latestUserMessageIndex) {
                    // Convert the latest user message to include images from all visual contexts
                    const imageAttachments = await Promise.all(visualContexts.map(async (ctx: any) => {

                        if (ctx.type === 'drawing') {
                            // Handle drawings (base64 data)
                            return {
                                type: 'image',
                                source: {
                                    type: 'base64',
                                    media_type: 'image/png',
                                    data: ctx.data.split(',')[1] // Remove data:image/png;base64, prefix
                                }
                            };
                        } else if (ctx.type === 'image') {
                            // Handle media library images - convert URL to base64
                            console.log('WE HAVE AN IMAGE');
                            console.log('ctx.data', ctx.data);
                            try {
                                const { data, media_type } = await convertImageUrlToBase64(ctx.data.url);
                                console.log('Image converted successfully:', { media_type, dataLength: data.length });
                                const imageAttachment = {
                                    type: 'image',
                                    source: {
                                        type: 'base64',
                                        media_type: media_type,
                                        data: data
                                    }
                                };
                                console.log('Image attachment created:', imageAttachment);
                                return imageAttachment;
                            } catch (error) {
                                console.error('Error converting media library image to base64:', error);
                                return null;
                            }
                        } else if (ctx.type === 'block' && (ctx.data?.name === 'core/image' || ctx.data?.name === 'core/cover')) {
                            // Handle image blocks - convert URL to base64
                            const imageUrl = ctx.data?.attributes?.url;
                            if (imageUrl) {
                                try {
                                    const { data, media_type } = await convertImageUrlToBase64(imageUrl);
                                    return {
                                        type: 'image',
                                        source: {
                                            type: 'base64',
                                            media_type: media_type,
                                            data: data
                                        }
                                    };
                                } catch (error) {
                                    console.error('Error converting image block to base64:', error);
                                    return null;
                                }
                            }
                        }
                        return null;
                    }));

                    const validImageAttachments = imageAttachments.filter(Boolean);
                    console.log('Valid image attachments:', validImageAttachments.length);

                    if (validImageAttachments.length > 0) {
                        const messageWithImages = {
                            role: message.role,
                            content: [
                                {
                                    type: 'text',
                                    text: message.content
                                },
                                ...validImageAttachments
                            ]
                        };
                        console.log('Message with images:', JSON.stringify(messageWithImages, null, 2));
                        return messageWithImages;
                    }
                }

                const baseMessage: any = {
                    role: message.role,
                    content: message.content
                };

                // Preserve tool-related fields for tool messages
                if (message.role === 'tool') {
                    if ((message as any).toolCallId) baseMessage.toolCallId = (message as any).toolCallId;
                    if ((message as any).toolName) baseMessage.toolName = (message as any).toolName;
                    if ((message as any).toolArgs) baseMessage.toolArgs = (message as any).toolArgs;
                    if ((message as any).toolResult) baseMessage.toolResult = (message as any).toolResult;
                }

                return baseMessage;
            }));

            // Filter out null entries (from skipped messages)
            convertedMessages = convertedMessages.filter(Boolean);
        } else {
            // No visual contexts, just convert normally
            const messagesWithAssistant: any[] = [];

            messages.forEach((message) => {
                // Skip tool_confirmation, reasoning, and thinking messages - they're UI only
                if (message.role === 'tool_confirmation' || message.role === 'thinking') {
                    return;
                }

                // If this is a tool message, inject assistant message with function call first
                if (message.role === 'tool' && (message as any).toolName) {
                    messagesWithAssistant.push({
                        role: 'assistant',
                        content: '',  // Function calls have no text content
                        toolCallId: (message as any).toolCallId,
                        toolName: (message as any).toolName,
                        toolArgs: (message as any).toolArgs
                    });
                }

                const baseMessage: any = {
                    role: message.role,
                    content: message.content
                };

                // Preserve tool-related fields for tool messages
                if (message.role === 'tool') {
                    if ((message as any).toolCallId) baseMessage.toolCallId = (message as any).toolCallId;
                    if ((message as any).toolName) baseMessage.toolName = (message as any).toolName;
                    if ((message as any).toolArgs) baseMessage.toolArgs = (message as any).toolArgs;
                    if ((message as any).toolResult) baseMessage.toolResult = (message as any).toolResult;
                }

                messagesWithAssistant.push(baseMessage);
            });

            convertedMessages = messagesWithAssistant;
        }

        // Convert messages to Gemini format for WebSocket
        const geminiMessages: any[] = [];

        for (let i = 0; i < convertedMessages.length; i++) {
            const message = convertedMessages[i];

            if (message.role === 'user') {
                geminiMessages.push({
                    role: 'user',
                    parts: Array.isArray(message.content) ? message.content : [{ text: message.content }]
                });
            } else if (message.role === 'assistant' || message.role === 'model') {
                // Check if this assistant message has a tool call
                const hasToolCall = message.toolName && message.toolArgs;

                if (hasToolCall) {
                    // Assistant message with function call
                    geminiMessages.push({
                        role: 'model',
                        parts: [
                            {
                                functionCall: {
                                    name: message.toolName,
                                    args: message.toolArgs
                                }
                            }
                        ]
                    });
                } else {
                    // Regular assistant message
                    geminiMessages.push({
                        role: 'model',
                        parts: Array.isArray(message.content) ? message.content : [{ text: message.content || '' }]
                    });
                }
            } else if (message.role === 'tool') {
                // Tool result - must be sent as functionResponse
                geminiMessages.push({
                    role: 'user',
                    parts: [
                        {
                            functionResponse: {
                                name: message.toolName,
                                response: {
                                    content: message.toolResult || message.content
                                }
                            }
                        }
                    ]
                });
            }
        }

        // Log converted messages after Gemini format conversion
        console.log('📤 Gemini messages after conversion:', JSON.stringify(geminiMessages, null, 2));

        const requestBody: any = {
            messages: geminiMessages,
            system: systemPrompt ? [{ text: systemPrompt }] : undefined,
            tools: tools || []
        };

        console.log('🚀 WebSocket request body (full):', JSON.stringify(requestBody, null, 2));

        // Check if WebSocket is connected
        if (!isConnected) {
            throw new Error('WebSocket not connected. Please wait for connection.');
        }

        return new Promise((resolve, reject) => {
            let accumulatedContent = '';
            let accumulatedThinking = '';
            let functionCalls: any[] = [];
            let isComplete = false;

            // Handle abort signal
            if (abortSignal) {
                abortSignal.addEventListener('abort', () => {
                    isComplete = true;
                    reject(new DOMException('Aborted', 'AbortError'));
                });
            }

            // Handler for incoming messages
            const handleMessage = (data: any) => {
                if (isComplete) return; // Ignore messages after completion

                console.log('📦 WebSocket message received:', data.type);

                    switch (data.type) {
                        case 'content':
                            console.log('📝 Content chunk:', data.content?.substring(0, 50) + '...');
                            accumulatedContent = data.accumulated || accumulatedContent + data.content;

                            // Emit streaming chunk for real-time UI updates
                            if (onStreamChunk) {
                                onStreamChunk({
                                    type: 'content',
                                    content: data.content,
                                    accumulated: accumulatedContent
                                });
                            }
                            break;

                        case 'thinking':
                            console.log('🤔 Thinking chunk:', data.content?.substring(0, 50) + '...');
                            accumulatedThinking = data.accumulated || accumulatedThinking + data.content;

                            // Emit thinking chunk for UI
                            if (onStreamChunk) {
                                onStreamChunk({
                                    type: 'thinking',
                                    content: data.content,
                                    accumulated: accumulatedThinking
                                });
                            }
                            break;

                        case 'function_calls':
                            console.log('🔧 Function calls received:', data.functionCalls);
                            functionCalls = data.functionCalls || [];

                            // For now, we'll handle function calls by returning them when done
                            // In the future, we might want to stream these too
                            break;

                        case 'done':
                            console.log('✅ Stream completed');
                            console.log('   Content length:', data.contentLength);
                            console.log('   Thinking length:', data.thinkingLength);
                            console.log('   Total chunks:', data.totalChunks);
                            console.log('   Function calls:', functionCalls.length);
                            isComplete = true;

                            // If we have function calls, return the first one as a tool call
                            if (functionCalls.length > 0) {
                                const firstCall = functionCalls[0];
                                console.log('🔧 Returning tool call:', firstCall.name, 'with args:', firstCall.args);
                                resolve({
                                    content: accumulatedContent,
                                    toolName: firstCall.name,
                                    toolArgs: firstCall.args,
                                    toolCallId: `call_${Date.now()}`
                                } as any);
                            } else {
                                console.log('💬 Returning text response');
                                resolve({
                                    content: accumulatedContent,
                                    toolName: undefined,
                                    toolArgs: undefined
                                } as MCPClientMessage);
                            }
                            break;

                        case 'error':
                            console.error('❌ Server error:', data.message);
                            isComplete = true;
                            reject(new Error(data.message || 'WebSocket error'));
                            break;

                        default:
                            console.warn('⚠️ Unknown message type:', data.type);
                    }
            };

            // Send the request using persistent connection
            try {
                sendRequest(
                    {
                        type: 'generate',
                        data: requestBody
                    },
                    handleMessage,
                    () => {
                        // Cleanup on complete
                        console.log('Request completed');
                    }
                );
            } catch (error) {
                reject(error);
            }
        });
    };

    const parseAIResponse = (response: any): MCPClientAIResponse => {
        // Try to parse reasoning from content if it's JSON
        if (response.content) {
            // Check if content is JSON reasoning response
            const trimmedContent = response.content.trim();

            // First, try to extract JSON from markdown code block
            const jsonMatch = trimmedContent.match(/```json\s*\n?([\s\S]*?)\n?```/);
            if (jsonMatch) {
                try {
                    const parsed = JSON.parse(jsonMatch[1]);
                    if (parsed.type === 'reasoning' && parsed.reasoning) {
                        return {
                            type: 'reasoning',
                            reasoning: parsed.reasoning
                        };
                    }
                } catch (e) {
                    console.warn('Failed to parse JSON from markdown code block:', e);
                    // Continue to try other parsing methods
                }
            }

            // Second, try to parse as direct JSON (without code block)
            if (trimmedContent.startsWith('{') && trimmedContent.includes('"reasoning"')) {
                try {
                    const parsed = JSON.parse(trimmedContent);
                    if (parsed.type === 'reasoning' && parsed.reasoning) {
                        return {
                            type: 'reasoning',
                            reasoning: parsed.reasoning
                        };
                    }
                } catch (e) {
                    console.warn('Failed to parse direct JSON:', e);
                    // Continue to normal text response
                }
            }

            // Normal text response
            return {
                type: 'text',
                content: response.content
            };
        }

        else if (response.toolName) {
            return {
                type: 'tool',
                toolName: response.toolName,
                toolArgs: response.toolArgs
            };
        }

        return {
            type: 'text',
            content: "No response from AI service"
        };
    };

    return {
        callAI,
        parseAIResponse
    };
};
