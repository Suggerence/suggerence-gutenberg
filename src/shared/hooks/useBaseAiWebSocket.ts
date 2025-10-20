import { convertImageUrlToBase64 } from "../utils/image-utils";
import { WEBSOCKET_CONFIG } from "../config/websocket";

export const useBaseAIWebSocket = (config: UseBaseAIConfig): UseBaseAIReturn => {
    const callAI = async (
        messages: MCPClientMessage[],
        model: AIModel | null,
        tools: SuggerenceMCPResponseTool[],
        abortSignal?: AbortSignal
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
                // Skip tool_confirmation and reasoning messages - they're UI only
                if (message.role === 'tool_confirmation' || message.role === 'reasoning') {
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
                // Skip tool_confirmation and reasoning messages - they're UI only
                if (message.role === 'tool_confirmation' || message.role === 'reasoning') {
                    return;
                }

                // If this is a tool message with assistant response data, inject assistant message first
                if (message.role === 'tool' && (message as any)._assistantResponse) {
                    const assistantMsg = (message as any)._assistantResponse;
                    messagesWithAssistant.push({
                        role: 'assistant',
                        content: assistantMsg.content || '',
                        ...(((message as any).toolCallId) && { toolCallId: (message as any).toolCallId }),
                        ...(((message as any).toolName) && { toolName: (message as any).toolName }),
                        ...(((message as any).toolArgs) && { toolArgs: (message as any).toolArgs })
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
        const geminiMessages = convertedMessages.map((message: any) => {
            if (message.role === 'user') {
                return {
                    role: 'user',
                    parts: Array.isArray(message.content) ? message.content : [{ text: message.content }]
                };
            } else if (message.role === 'assistant') {
                return {
                    role: 'model',
                    parts: Array.isArray(message.content) ? message.content : [{ text: message.content }]
                };
            }
            return message;
        });

        const requestBody: any = {
            messages: geminiMessages,
            system: systemPrompt ? [{ text: systemPrompt }] : undefined,
            tools: tools || []
        };

        console.log('WebSocket request body:', JSON.stringify(requestBody, null, 2));

        // Get API key and WebSocket URL from configuration
        const apiKey = WEBSOCKET_CONFIG.getApiKey();
        const wsUrl = WEBSOCKET_CONFIG.getWebSocketUrl();
        
        return new Promise((resolve, reject) => {
            // Create WebSocket with API key as query parameter
            const wsUrlWithAuth = wsUrl; //`${wsUrl}?api_key=${encodeURIComponent(apiKey)}`;
            console.log('Attempting WebSocket connection to:', wsUrlWithAuth);
            console.log('Current location:', window.location.href);
            console.log('WebSocket URL:', wsUrl);
            console.log('API Key (first 10 chars):', apiKey.substring(0, 10));

            const ws = new WebSocket(wsUrlWithAuth);
            let accumulatedContent = '';
            let isComplete = false;

            console.log('WebSocket created, readyState:', ws.readyState);

            // Handle abort signal
            if (abortSignal) {
                abortSignal.addEventListener('abort', () => {
                    ws.close();
                    reject(new DOMException('Aborted', 'AbortError'));
                });
            }

            ws.onopen = () => {
                console.log('✅ WebSocket connected successfully to:', wsUrlWithAuth);
                console.log('WebSocket readyState after open:', ws.readyState);
                console.log('Sending generation request...');
                // Send the generation request
                ws.send(JSON.stringify({
                    type: 'generate',
                    data: requestBody
                }));
                console.log('Generation request sent');
            };

            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    console.log('WebSocket message received:', data);

                    switch (data.type) {
                        case 'content':
                            accumulatedContent += data.content;
                            break;
                        case 'thinking':
                            console.log('Thinking:', data.thinking);
                            break;
                        case 'function_calls':
                            console.log('Function calls:', data.functionCalls);
                            break;
                        case 'done':
                            isComplete = true;
                            ws.close();
                            resolve({
                                content: accumulatedContent,
                                toolName: undefined,
                                toolArgs: undefined
                            } as MCPClientMessage);
                            break;
                        case 'error':
                            ws.close();
                            reject(new Error(data.message || 'WebSocket error'));
                            break;
                    }
                } catch (error) {
                    console.error('Error parsing WebSocket message:', error);
                }
            };

            ws.onerror = (error) => {
                console.error('❌ WebSocket error:', error);
                console.error('WebSocket readyState:', ws.readyState);
                console.error('Failed to connect to:', wsUrlWithAuth);
                console.error('Current origin:', window.location.origin);
                console.error('Target:', wsUrlWithAuth);
                console.error('Make sure the API server is running on the correct port');
                console.error('Common causes:');
                console.error('1. API server not running');
                console.error('2. CORS/Origin blocking');
                console.error('3. Network firewall');
                ws.close();
                reject(new Error(`WebSocket connection failed to ${wsUrlWithAuth}. Make sure the API server is running.`));
            };

            ws.onclose = () => {
                if (!isComplete) {
                    reject(new Error('WebSocket connection closed unexpectedly'));
                }
            };
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
