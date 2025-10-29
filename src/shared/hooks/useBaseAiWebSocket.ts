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
        // Get comprehensive site context using the provided function
        const siteContext = config.getSiteContext();

        const systemPrompt = config.getSystemPrompt(siteContext);

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

            // First pass: collect all messages with images attached to latest user message
            const processedMessages = await Promise.all(messages.map(async (message, index) => {
                // Skip tool_confirmation messages - they're UI only
                // IMPORTANT: We now KEEP thinking messages to send to Claude
                if (message.role === 'tool_confirmation') {
                    return null;
                }

                if (index === latestUserMessageIndex) {
                    // Convert the latest user message to include images from all visual contexts
                    const imageAttachments = await Promise.all(visualContexts.map(async (ctx: any) => {

                        if (ctx.type === 'drawing') {
                            // Handle drawings (base64 data) - Claude format
                            return {
                                type: 'image',
                                source: {
                                    type: 'base64',
                                    media_type: 'image/png',
                                    data: ctx.data.split(',')[1] // Remove data:image/png;base64, prefix
                                }
                            };
                        } else if (ctx.type === 'image') {
                            // Handle media library images - convert URL to base64 - Claude format
                            try {
                                const { data, media_type } = await convertImageUrlToBase64(ctx.data.url);
                                return {
                                    type: 'image',
                                    source: {
                                        type: 'base64',
                                        media_type: media_type,
                                        data: data
                                    }
                                };
                            } catch (error) {
                                console.error('Error converting media library image to base64:', error);
                                return null;
                            }
                        } else if (ctx.type === 'block' && (ctx.data?.name === 'core/image' || ctx.data?.name === 'core/cover')) {
                            // Handle image blocks - convert URL to base64 - Claude format
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

                // Preserve thinking-related fields for thinking messages
                if (message.role === 'thinking') {
                    if ((message as any).thinkingSignature) baseMessage.thinkingSignature = (message as any).thinkingSignature;
                    if ((message as any).thinkingDuration) baseMessage.thinkingDuration = (message as any).thinkingDuration;
                }

                return baseMessage;
            }));

            // Filter out null entries (from skipped messages)
            const filteredMessages = processedMessages.filter(Boolean);

            // Second pass: inject assistant messages with tool calls before tool results
            // This is the CRITICAL fix - same logic as non-visual path
            const messagesWithAssistant: any[] = [];
            filteredMessages.forEach((message) => {
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

                messagesWithAssistant.push(message);
            });

            convertedMessages = messagesWithAssistant;
        } else {
            // No visual contexts, just convert normally
            const messagesWithAssistant: any[] = [];

            messages.forEach((message) => {
                // Skip tool_confirmation messages - they're UI only
                // IMPORTANT: We now KEEP thinking messages to send to Claude
                if (message.role === 'tool_confirmation') {
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

                // Preserve thinking-related fields for thinking messages
                if (message.role === 'thinking') {
                    if ((message as any).thinkingSignature) baseMessage.thinkingSignature = (message as any).thinkingSignature;
                    if ((message as any).thinkingDuration) baseMessage.thinkingDuration = (message as any).thinkingDuration;
                }

                messagesWithAssistant.push(baseMessage);
            });

            convertedMessages = messagesWithAssistant;
        }

        // Convert messages to Claude format for WebSocket
        const claudeMessages: any[] = [];

        for (let i = 0; i < convertedMessages.length; i++) {
            const message = convertedMessages[i];

            if (message.role === 'user') {
                // User messages
                claudeMessages.push({
                    role: 'user',
                    content: Array.isArray(message.content) ? message.content : message.content
                });
            } else if (message.role === 'thinking') {
                // Thinking messages will be combined with assistant messages
                // Skip for now, handled in assistant message section
                continue;
            } else if (message.role === 'assistant' || message.role === 'model') {
                // Check if this assistant message has a tool call
                const hasToolCall = message.toolName && message.toolArgs;

                // Look back for thinking message
                let thinkingMessage = null;
                if (i > 0 && convertedMessages[i - 1].role === 'thinking') {
                    thinkingMessage = convertedMessages[i - 1];
                }

                if (hasToolCall) {
                    // Assistant message with tool call
                    const content: any[] = [];

                    // Add thinking if present
                    if (thinkingMessage) {
                        content.push({
                            type: 'thinking',
                            thinking: thinkingMessage.content,
                            signature: (thinkingMessage as any).thinkingSignature
                        });
                    }

                    // Add tool use
                    content.push({
                        type: 'tool_use',
                        id: message.toolCallId,
                        name: message.toolName,
                        input: message.toolArgs
                    });

                    claudeMessages.push({
                        role: 'assistant',
                        content: content
                    });
                } else {
                    // Regular assistant message (text content)
                    // If there's thinking, we need to structure as content array
                    if (thinkingMessage) {
                        const content: any[] = [];

                        // Add thinking first
                        content.push({
                            type: 'thinking',
                            thinking: thinkingMessage.content,
                            signature: (thinkingMessage as any).thinkingSignature
                        });

                        // Add text content
                        if (message.content) {
                            content.push({
                                type: 'text',
                                text: message.content
                            });
                        }

                        claudeMessages.push({
                            role: 'assistant',
                            content: content
                        });
                    } else {
                        // No thinking, simple text message
                        claudeMessages.push({
                            role: 'assistant',
                            content: message.content || ''
                        });
                    }
                }
            } else if (message.role === 'tool') {
                // Tool result
                claudeMessages.push({
                    role: 'user',
                    content: [
                        {
                            type: 'tool_result',
                            tool_use_id: message.toolCallId,
                            content: message.toolResult || message.content
                        }
                    ]
                });
            }
        }

        // Convert tools to Claude format (inputSchema -> input_schema)
        // Only include Claude-compatible fields (name, description, input_schema)
        const claudeTools = (tools || []).map((tool: any) => {
            const inputSchema = tool.inputSchema || tool.input_schema;

            // Recursively clean up schema to be JSON Schema Draft 2020-12 compliant
            const cleanSchema = (obj: any): any => {
                if (obj === null || typeof obj !== 'object') return obj;

                if (Array.isArray(obj)) {
                    return obj.map(cleanSchema);
                }

                const cleaned: any = {};
                for (const [key, value] of Object.entries(obj)) {
                    // Skip invalid 'required' inside property definitions (should only be at schema level)
                    if (key === 'required' && typeof value === 'boolean') {
                        continue;
                    }

                    // Keep additionalProperties only if it's a boolean
                    if (key === 'additionalProperties') {
                        if (typeof value === 'boolean') {
                            cleaned[key] = value;
                        }
                        continue;
                    }

                    // Recursively clean nested objects
                    if (typeof value === 'object' && value !== null) {
                        cleaned[key] = cleanSchema(value);
                    } else {
                        cleaned[key] = value;
                    }
                }
                return cleaned;
            };

            return {
                name: tool.name,
                description: tool.description,
                input_schema: cleanSchema(inputSchema)
                // Exclude custom fields like 'dangerous' - Claude doesn't accept them
            };
        });

        // Claude format request body
        const requestBody: any = {
            messages: claudeMessages,
            system: systemPrompt,
            tools: claudeTools
        };

        // Check if WebSocket is connected
        if (!isConnected) {
            throw new Error('WebSocket not connected. Please wait for connection.');
        }

        return new Promise((resolve, reject) => {
            let accumulatedContent = '';
            let accumulatedThinking = '';
            let thinkingSignature = '';
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
                    switch (data.type) {
                        case 'content':
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
                            // Accumulate function calls - Claude can send multiple tool calls
                            // as separate WebSocket messages in a single response
                            if (data.functionCalls && Array.isArray(data.functionCalls)) {
                                functionCalls.push(...data.functionCalls);
                            }
                            break;

                        case 'done':
                            isComplete = true;

                            // Capture thinking signature from done message
                            if (data.thinkingSignature) {
                                thinkingSignature = data.thinkingSignature;
                            }

                            // Return ALL function calls, not just the first one
                            if (functionCalls.length > 0) {
                                // Return first call in the old structure for compatibility
                                // but include all calls in a new field
                                const firstCall = functionCalls[0];
                                resolve({
                                    content: accumulatedContent,
                                    toolName: firstCall.name,
                                    toolArgs: firstCall.args,
                                    toolCallId: firstCall.id || `call_${Date.now()}`,
                                    thinkingSignature: thinkingSignature || undefined,
                                    // NEW: Include all function calls
                                    allFunctionCalls: functionCalls
                                } as any);
                            } else {
                                resolve({
                                    content: accumulatedContent,
                                    toolName: undefined,
                                    toolArgs: undefined,
                                    thinkingSignature: thinkingSignature || undefined
                                } as any);
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
                    }
                );
            } catch (error) {
                reject(error);
            }
        });
    };

    const parseAIResponse = (response: any): MCPClientAIResponse => {
        // PRIORITY 1: Check for tool calls FIRST
        // When Claude sends both text content AND tool calls, the text has already been
        // displayed via onStreamChunk callback, so we should execute the tool
        if (response.toolName) {
            return {
                type: 'tool',
                toolName: response.toolName,
                toolArgs: response.toolArgs
            };
        }

        // PRIORITY 2: Try to parse reasoning from content if it's JSON
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
