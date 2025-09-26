interface UseGutenbergAITools {
    executeCommand: (command: string) => Promise<boolean>;
    isLoading: boolean;
}

interface UseGutenbergMCPTools {
    isGutenbergServerReady: boolean;
    getGutenbergTools: () => Promise<SuggerenceMCPResponseTool[]>;
    callGutenbergTool: (toolName: string, args: Record<string, any>) => Promise<any>;
}