interface UseAITools {
    callAI: (messages: MCPClientMessage[], model: AIModel | null, tools: SuggerenceMCPResponseTool[]) => Promise<MCPClientMessage>;
    parseAIResponse: (response: any) => MCPClientAIResponse;
}

interface UseGutenbergMCPTools {
    isGutenbergServerReady: boolean;
    getGutenbergTools: () => Promise<SuggerenceMCPResponseTool[]>;
    callGutenbergTool: (toolName: string, args: Record<string, any>) => Promise<any>;
}