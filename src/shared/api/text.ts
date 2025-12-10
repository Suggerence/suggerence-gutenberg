import { getWebsocketAuthToken, clearWebsocketAuthToken } from '@/shared/auth/websocketToken';

declare const SuggerenceData: SuggerenceData;

type ClaudeSourceMessage = {
    role: string;
    content: any;
    toolCallId?: string;
    toolName?: string;
    toolArgs?: any;
    toolResult?: any;
    thinkingSignature?: string;
};

export type TextCompletionRequest = {
    system: SystemPromptPayload;
    messages: ClaudeSourceMessage[];
    tools?: SuggerenceMCPResponseTool[];
    model?: string | null;
    provider?: string | null;
};

const getTextEndpoint = (): string => {
    const base = (SuggerenceData?.suggerence_api_url || 'https://api.suggerence.com/v1').replace(/\/$/, '');
    return `${base}/gutenberg/text`;
};

const convertMessagesToClaude = (messages: ClaudeSourceMessage[]): any[] => {
    const claudeMessages: any[] = [];

    for (let i = 0; i < messages.length; i++) {
        const message = messages[i];
        if (!message) {
            continue;
        }

        if (message.role === 'user') {
            claudeMessages.push({
                role: 'user',
                content: Array.isArray(message.content) ? message.content : message.content
            });
            continue;
        }

        if (message.role === 'thinking') {
            continue;
        }

        if (message.role === 'assistant' || message.role === 'model') {
            const hasToolCall = message.toolName && message.toolArgs;
            let thinkingMessage: ClaudeSourceMessage | null = null;

            if (i > 0 && messages[i - 1]?.role === 'thinking') {
                thinkingMessage = messages[i - 1];
            }

            if (hasToolCall) {
                const content: any[] = [];

                if (thinkingMessage) {
                    content.push({
                        type: 'thinking',
                        thinking: thinkingMessage.content,
                        signature: (thinkingMessage as any).thinkingSignature
                    });
                }

                content.push({
                    type: 'tool_use',
                    id: message.toolCallId,
                    name: message.toolName,
                    input: message.toolArgs
                });

                claudeMessages.push({
                    role: 'assistant',
                    content
                });
            } else if (thinkingMessage) {
                const content: any[] = [];

                content.push({
                    type: 'thinking',
                    thinking: thinkingMessage.content,
                    signature: (thinkingMessage as any).thinkingSignature
                });

                if (message.content) {
                    content.push({
                        type: 'text',
                        text: message.content
                    });
                }

                claudeMessages.push({
                    role: 'assistant',
                    content
                });
            } else {
                claudeMessages.push({
                    role: 'assistant',
                    content: message.content || ''
                });
            }

            continue;
        }

        if (message.role === 'tool') {
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

    return claudeMessages;
};

const cleanSchema = (obj: any): any => {
    if (obj === null || typeof obj !== 'object') {
        return obj;
    }

    if (Array.isArray(obj)) {
        return obj.map(cleanSchema);
    }

    const cleaned: any = {};
    for (const [key, value] of Object.entries(obj)) {
        if (key === 'required' && typeof value === 'boolean') {
            continue;
        }

        if (key === 'additionalProperties') {
            if (typeof value === 'boolean') {
                cleaned[key] = value;
            }
            continue;
        }

        if (typeof value === 'object' && value !== null) {
            cleaned[key] = cleanSchema(value);
        } else {
            cleaned[key] = value;
        }
    }

    return cleaned;
};

const convertToolsToClaude = (tools: SuggerenceMCPResponseTool[] = []): any[] => {
    return tools.map((tool) => {
        const inputSchema = tool.inputSchema || (tool as any).input_schema;
        const normalized: Record<string, any> = {
            name: tool.name,
            description: tool.description
        };

        if (inputSchema) {
            normalized.input_schema = cleanSchema(inputSchema);
        }

        return normalized;
    });
};

const requestOnce = async (body: Record<string, any>, signal: AbortSignal | undefined, retry: boolean): Promise<any> => {
    const token = await getWebsocketAuthToken();
    const response = await fetch(getTextEndpoint(), {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(body),
        credentials: 'omit',
        signal
    });

    if ((response.status === 401 || response.status === 403) && retry) {
        clearWebsocketAuthToken();
        return requestOnce(body, signal, false);
    }

    let data: any = null;
    try {
        data = await response.json();
    } catch (error) {
        // Ignore JSON errors until we confirm the response status
    }

    if (!response.ok) {
        const message = data?.error || data?.message || `Suggerence text request failed (${response.status})`;
        throw new Error(message);
    }

    return data ?? {};
};

export const requestTextCompletion = async (
    payload: TextCompletionRequest,
    signal?: AbortSignal
): Promise<any> => {
    const body: Record<string, any> = {
        messages: convertMessagesToClaude(payload.messages || []),
        system: payload.system
    };

    if (payload.model) {
        body.model = payload.model;
    }

    if (payload.provider) {
        body.provider = payload.provider;
    }

    if (payload.tools && payload.tools.length > 0) {
        body.tools = convertToolsToClaude(payload.tools);
    }

    return requestOnce(body, signal, true);
};
