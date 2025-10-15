import apiFetch from "@wordpress/api-fetch";
import { convertImageUrlToBase64 } from "../utils/image-utils";

export const useBaseAI = (config: UseBaseAIConfig): UseBaseAIReturn => {
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

                    if (validImageAttachments.length > 0) {
                        return {
                            role: message.role,
                            content: [
                                {
                                    type: 'text',
                                    text: message.content
                                },
                                ...validImageAttachments
                            ]
                        };
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

        const requestBody: any = {
            model: model?.id,
            provider: model?.provider,
            system: systemPrompt,
            messages: convertedMessages
        };

        if (tools) {
            requestBody.tools = tools;
        }

        // Retry configuration
        const MAX_RETRIES = 3;
        const INITIAL_DELAY = 1000; // 1 second
        let lastError: any = null;

        // Retry loop with exponential backoff
        for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
            try {
                console.log(`AI request attempt ${attempt + 1}/${MAX_RETRIES}`);
                
                const response = await apiFetch({
                    path: 'suggerence-gutenberg/ai-providers/v1/providers/text',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    method: "POST",
                    body: JSON.stringify(requestBody),
                    signal: abortSignal,
                }) as any;

                // Check if response has empty content (treat as error)
                const hasEmptyContent = 
                    (!response.content || response.content.trim() === '') && 
                    !response.toolName;
                
                if (hasEmptyContent) {
                    const isLastAttempt = attempt === MAX_RETRIES - 1;
                    console.warn(`AI request attempt ${attempt + 1} returned empty content`);
                    
                    if (isLastAttempt) {
                        console.error('AI returned empty content after all retries');
                        // Return the empty response on last attempt
                        return response as MCPClientMessage;
                    }
                    
                    // Calculate delay with exponential backoff
                    const delay = INITIAL_DELAY * Math.pow(2, attempt);
                    console.log(`Retrying in ${delay}ms due to empty content...`);
                    
                    // Wait before retrying
                    await new Promise(resolve => setTimeout(resolve, delay));
                    continue; // Retry
                }

                // Success - return response with content
                return response as MCPClientMessage;
                
            } catch (error: any) {
                lastError = error;
                const isLastAttempt = attempt === MAX_RETRIES - 1;
                
                // Check if error is retryable (network errors or 5xx server errors)
                const isRetryable = 
                    !error.code || // Network errors often don't have a code
                    error.code === 'fetch_error' ||
                    (error.code >= 500 && error.code < 600) ||
                    error.message?.includes('NetworkError') ||
                    error.message?.includes('Failed to fetch');
                
                // Log the error
                console.warn(`AI request attempt ${attempt + 1} failed:`, error.message || error);
                
                // If this is the last attempt or error is not retryable, throw
                if (isLastAttempt || !isRetryable) {
                    console.error('AI request failed after all retries or non-retryable error');
                    throw error;
                }
                
                // Calculate delay with exponential backoff
                const delay = INITIAL_DELAY * Math.pow(2, attempt);
                console.log(`Retrying in ${delay}ms...`);
                
                // Wait before retrying
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }

        // This should never be reached, but TypeScript needs it
        throw lastError || new Error('Failed to get AI response after retries');
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