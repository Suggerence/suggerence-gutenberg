interface UseAITools {
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

interface UseGutenbergMCPTools {
    isGutenbergServerReady: boolean;
    getGutenbergTools: () => Promise<SuggerenceMCPResponseTool[]>;
    callGutenbergTool: (toolName: string, args: Record<string, any>, signal?: AbortSignal) => Promise<any>;
}