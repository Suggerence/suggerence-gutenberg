interface UseBaseMCPConfig {
    serverName: string;
    debugName: string;
    toolPrefix: string;
}

interface MCPServerConnection {
    name: string;
    client: any;
}

interface UseBaseMCPReturn {
    isServerReady: boolean;
    getTools: () => Promise<SuggerenceMCPResponseTool[]>;
    callTool: (toolName: string, args: Record<string, any>, signal?: AbortSignal) => Promise<any>;
}

interface PromptTemplateRequest {
    promptId: string;
    variables?: Record<string, any>;
}

type SystemPromptPayload = string | any[] | PromptTemplateRequest;

interface UseBaseAIConfig {
    getSystemPrompt: (siteContext: any) => SystemPromptPayload;
    getSiteContext: () => any;
}

interface UseBaseAIReturn {
    callAI: (
        messages: MCPClientMessage[],
        model: AIModel | null,
        tools: SuggerenceMCPResponseTool[],
        abortSignal?: AbortSignal,
        onStreamChunk?: (chunk: { type: string; content: string; accumulated: string }) => void,
        onFunctionCall?: (functionCall: { id: string; name: string; args: any }) => void,
        onThinkingSignature?: (signature: string) => void
    ) => Promise<MCPClientMessage>;
    parseAIResponse: (response: any) => MCPClientAIResponse;
}
