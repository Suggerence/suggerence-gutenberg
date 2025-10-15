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

interface UseBaseAIConfig {
    getSystemPrompt: (siteContext: any) => string;
    getSiteContext: () => any;
}

interface UseBaseAIReturn {
    callAI: (messages: MCPClientMessage[], model: AIModel | null, tools: SuggerenceMCPResponseTool[]) => Promise<MCPClientMessage>;
    parseAIResponse: (response: any) => MCPClientAIResponse;
}
