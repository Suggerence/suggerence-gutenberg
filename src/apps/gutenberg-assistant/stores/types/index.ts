export interface SelectedContext {
    id: string;
    type: string;
    label: string;
    data?: any;
}

export interface ContextUsage {
    totalTokens: number;
    percentage: number;
    breakdown: {
        systemPrompt: number;
        messages: number;
        selectedContexts: number;
        gutenbergContext: number;
    };
}

export interface ContextState {
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

export interface GutenbergAssistantMessagesStore {
    postId: number;
    setPostId: (postId: number) => void;
    messages: MCPClientMessage[];
    setMessages: (messages: MCPClientMessage[]) => void;
    setLastMessage: (message: MCPClientMessage) => void;
    addMessage: (message: MCPClientMessage) => void;
    clearMessages: () => void;

    // Conversation state
    isLoading: boolean;
    setIsLoading: (isLoading: boolean) => void;
    abortController: AbortController | null;
    setAbortController: (abortController: AbortController | null) => void;

    // Message update manager
    _currentTracker: {
        thinking?: number;
        content?: number;
    };
    upsertThinkingMessage: (content: string, aiModel: string) => void;
    completeThinkingMessage: (thinkingDuration?: number, thinkingSignature?: string) => void;
    upsertContentMessage: (content: string, aiModel: string) => void;
    upsertToolMessage: (toolCallId: string, toolName: string, toolArgs: any, content: string, toolResult?: string) => void;
    completeToolMessage: (toolCallId: string, toolResult: string) => void;
    resetTracker: () => void;
}
