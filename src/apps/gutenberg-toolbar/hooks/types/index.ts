export interface UseGutenbergAITools {
    executeCommand: (command: string) => Promise<boolean>;
    isLoading: boolean;
}

export interface UseGutenbergMCPTools {
    isGutenbergServerReady: boolean;
    getGutenbergTools: () => Promise<SuggerenceMCPResponseTool[]>;
    callGutenbergTool: (toolName: string, args: Record<string, any>) => Promise<any>;
}