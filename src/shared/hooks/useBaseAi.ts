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
                        console.log('🔍 Processing visual context:', ctx.type, ctx);

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
                            console.log('🔍 Image context data:', ctx.data);
                            console.log('🔍 Image URL:', ctx.data.url);

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

                return { role: message.role, content: message.content };
            });
        } else {
            // No visual contexts, just convert normally
            convertedMessages = messages.map((message) => ({
                role: message.role,
                content: message.content
            }));
        }

        const requestBody: any = {
            model: model?.id,
            provider: model?.provider,
            system: systemPrompt,
            messages: convertedMessages
        };

        // Only add tools if they exist
        if (tools) {
            requestBody.tools = tools;
        }

        // Debug: Log the actual message contents (first 200 chars)
        requestBody.messages.forEach((msg: any, i: number) => {
            console.log(`🔍 DEBUG: Message ${i} (${msg.role}):`,
                Array.isArray(msg.content)
                    ? `Array with ${msg.content.length} items: ${msg.content.map((item: any) => item.type).join(', ')}`
                    : `String: "${msg.content.substring(0, 100)}..."`
            );
        });

        // @ts-ignore
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