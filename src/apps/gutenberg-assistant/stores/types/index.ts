interface ChatInterfaceStore {
    isLoading: boolean;
    setIsLoading: (isLoading: boolean) => void;
    abortController: AbortController | null;
    setAbortController: (abortController: AbortController | null) => void;
}

interface SelectedContext {
    id: string;
    type: string;
    label: string;
    data?: any;
}

interface ContextUsage {
    totalTokens: number;
    percentage: number;
    breakdown: {
        systemPrompt: number;
        messages: number;
        selectedContexts: number;
        gutenbergContext: number;
    };
}

interface ContextState {
    selectedContexts: SelectedContext[];
    contextUsage: ContextUsage | null;
    addContext: (context: SelectedContext) => void;
    removeContext: (contextId: string) => void;
    clearContexts: () => void;
    getContextsByType: (type: string) => SelectedContext[];
    hasContext: (type: string) => boolean;
    updateContextUsage: (params: {
        messages: MCPClientMessage[];
        systemPrompt: string;
        gutenbergContext: any;
    }) => void;
}

interface GutenbergAssistantMessagesStore {
    postId: number;
    setPostId: (postId: number) => void;
    messages: MCPClientMessage[];
    setMessages: (messages: MCPClientMessage[]) => void;
    setLastMessage: (message: MCPClientMessage) => void;
    addMessage: (message: MCPClientMessage) => void;
    clearMessages: () => void;
}