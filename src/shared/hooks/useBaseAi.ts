import apiFetch from "@wordpress/api-fetch";

export const useBaseAI = (config: UseBaseAIConfig): UseBaseAIReturn => {
    const callAI = async (
        messages: MCPClientMessage[],
        model: AIModel | null,
        tools: SuggerenceMCPResponseTool[]
    ): Promise<MCPClientMessage> => {
        // Get comprehensive site context using the provided function
        const siteContext = config.getSiteContext();

        // Get system prompt using the provided function
        const systemPrompt = config.getSystemPrompt(siteContext);

        // Check if we have visual contexts for the current conversation
        const visualContexts = siteContext.selectedContexts?.filter((ctx: any) =>
            ctx.type === 'drawing' || ctx.type === 'image'
        ) || [];

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

            convertedMessages = messages.map((message, index) => {
                if (index === latestUserMessageIndex) {
                    // Convert the latest user message to include images from all visual contexts
                    const imageAttachments = visualContexts.map((ctx: any) => {

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
                            // Handle media library images (URLs)

                            return {
                                type: 'image',
                                source: {
                                    type: 'url',
                                    url: ctx.data.url
                                }
                            };
                        }
                    }).filter(Boolean);

                    if (imageAttachments.length > 0) {
                        return {
                            role: message.role,
                            content: [
                                {
                                    type: 'text',
                                    text: message.content
                                },
                                ...imageAttachments
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
            });
        } else {
            // No visual contexts, just convert normally
            convertedMessages = messages.map((message) => {
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
            });
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

        const response = await apiFetch({
            path: 'suggerence-gutenberg/ai-providers/v1/providers/text',
            headers: {
                'Content-Type': 'application/json',
            },
            method: "POST",
            body: JSON.stringify(requestBody),
        });

        return response as MCPClientMessage;
    };

    const parseAIResponse = (response: any): MCPClientAIResponse => {
        if (response.content) {
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