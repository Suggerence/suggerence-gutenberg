import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

const initialMessages: MCPClientMessage[] = [];

const fallbackStorage: Storage = {
    length: 0,
    clear: () => undefined,
    getItem: () => null,
    key: () => null,
    removeItem: () => undefined,
    setItem: () => undefined
};

const STORAGE_PREFIX = 'suggerence-gutenberg-assistant-messages';

const getStorage = () =>
    (typeof window === 'undefined' || !window.localStorage)
        ? fallbackStorage
        : window.localStorage;

const normalizePostId = (value: number) => {
    const numeric = Number(value);
    if (!Number.isFinite(numeric) || numeric < 0) {
        return 0;
    }
    return Math.floor(numeric);
};

const getStorageKey = (postId: number) => `${STORAGE_PREFIX}-${postId}`;

const readMessagesForPost = (postId: number): MCPClientMessage[] => {
    try {
        const storage = getStorage();
        const raw = storage.getItem(getStorageKey(postId));
        if (!raw) {
            return [...initialMessages];
        }
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [...initialMessages];
    } catch (error) {
        console.warn('Suggerence: Failed to read conversation from storage', error);
        return [...initialMessages];
    }
};

const writeMessagesForPost = (postId: number, messages: MCPClientMessage[]) => {
    try {
        const storage = getStorage();
        storage.setItem(getStorageKey(postId), JSON.stringify(messages));
    } catch (error) {
        console.warn('Suggerence: Failed to persist conversation to storage', error);
    }
};

const clearMessagesForPost = (postId: number) => {
    try {
        const storage = getStorage();
        storage.removeItem(getStorageKey(postId));
    } catch (error) {
        console.warn('Suggerence: Failed to clear conversation from storage', error);
    }
};

const syncMessagesState = (state: any, messages: MCPClientMessage[], extraState: Record<string, any> = {}) => {
    const normalizedPostId = normalizePostId(state?.postId);
    writeMessagesForPost(normalizedPostId, messages);
    return {
        messages,
        ...extraState
    };
};

// Message type identifiers for tracking
type MessageTracker = {
    thinking?: number;  // Index of current thinking message
    content?: number;   // Index of current content message
};

// Unified store with message management and conversation state
export const useGutenbergAssistantMessagesStore = create<GutenbergAssistantMessagesStore>()(
    persist(
        (set) => ({
            postId: 0,
            messages: initialMessages,
            setPostId: (postId: number) => set(() => {
                const normalizedPostId = normalizePostId(postId);
                const storedMessages = readMessagesForPost(normalizedPostId);
                return {
                    postId: normalizedPostId,
                    messages: storedMessages
                };
            }),
            setMessages: (messages: MCPClientMessage[]) => set((state: any) =>
                syncMessagesState(state, [...messages])
            ),
            setLastMessage: (message: MCPClientMessage) => set((state: any) => {
                if (!state.messages?.length) {
                    return {};
                }
                const updated = [...state.messages.slice(0, -1), message];
                return syncMessagesState(state, updated);
            }),
            addMessage: (message: MCPClientMessage) => set((state: any) =>
                syncMessagesState(state, [...state.messages, message])
            ),
            clearMessages: () => set((state: any) => {
                const normalizedPostId = normalizePostId(state.postId);
                clearMessagesForPost(normalizedPostId);
                return { messages: [...initialMessages] };
            }),

            // Conversation state (not persisted)
            isLoading: false,
            setIsLoading: (isLoading: boolean) => set({ isLoading }),
            abortController: null,
            setAbortController: (abortController: AbortController | null) => set({ abortController }),

            // Message tracker for current streaming messages
            _currentTracker: {} as MessageTracker,

            // Start or update thinking message
            upsertThinkingMessage: (content: string, aiModel: string) =>
                set((state: any) => {
                    const tracker = state._currentTracker || {};

                    if (tracker.thinking !== undefined) {
                        const updated = [...state.messages];
                        updated[tracker.thinking] = {
                            ...updated[tracker.thinking],
                            content,
                            loading: true
                        };
                        return syncMessagesState(state, updated);
                    }

                    const newMessage = {
                        role: 'thinking' as const,
                        content,
                        date: new Date().toISOString(),
                        aiModel,
                        loading: true
                    };

                    return syncMessagesState(
                        state,
                        [...state.messages, newMessage],
                        { _currentTracker: { ...tracker, thinking: state.messages.length } }
                    );
                }),

            // Complete thinking message
            completeThinkingMessage: (thinkingDuration?: number, thinkingSignature?: string) =>
                set((state: any) => {
                    const tracker = state._currentTracker || {};

                    const resolveThinkingIndex = (): number | undefined => {
                        if (tracker.thinking !== undefined) {
                            return tracker.thinking;
                        }

                        for (let i = state.messages.length - 1; i >= 0; i--) {
                            if (state.messages[i]?.role === 'thinking') {
                                return i;
                            }
                        }
                        return undefined;
                    };

                    const thinkingIndex = resolveThinkingIndex();

                    if (thinkingIndex === undefined) {
                        return {};
                    }

                    const updated = [...state.messages];
                    const existing = updated[thinkingIndex] as any;

                    const finalDuration = thinkingDuration ?? existing?.thinkingDuration;
                    const finalSignature = thinkingSignature ?? existing?.thinkingSignature;
                    const finalContent = typeof existing?.content === 'string'
                        ? existing.content
                        : existing?.content?.toString?.() || '';

                    if (!finalSignature && finalContent.trim().length === 0) {
                        const cleanedMessages = updated.filter((_, index) => index !== thinkingIndex);
                        return syncMessagesState(
                            state,
                            cleanedMessages,
                            { _currentTracker: { ...tracker, thinking: undefined } }
                        );
                    }

                    updated[thinkingIndex] = {
                        ...existing,
                        loading: false,
                        thinkingDuration: finalDuration,
                        thinkingSignature: finalSignature
                    };

                    const shouldClearTracker = thinkingSignature !== undefined;
                    const nextTracker = shouldClearTracker
                        ? { ...tracker, thinking: undefined }
                        : tracker;

                    return syncMessagesState(state, updated, { _currentTracker: nextTracker });
                }),

            // Start or update content message
            // Content messages don't have loading states - they just stream and complete
            upsertContentMessage: (content: string, aiModel: string) =>
                set((state: any) => {
                    const tracker = state._currentTracker || {};

                    if (tracker.content !== undefined) {
                        const updated = [...state.messages];
                        updated[tracker.content] = {
                            ...updated[tracker.content],
                            content
                        };
                        return syncMessagesState(state, updated);
                    }

                    const newMessage = {
                        role: 'assistant' as const,
                        content,
                        date: new Date().toISOString(),
                        aiModel
                    };

                    return syncMessagesState(
                        state,
                        [...state.messages, newMessage],
                        { _currentTracker: { ...tracker, content: state.messages.length } }
                    );
                }),

            // Start or update tool message
            upsertToolMessage: (toolCallId: string, toolName: string, toolArgs: any, content: string, toolResult?: string) =>
                set((state: any) => {
                    const existingIndex = state.messages.findIndex(
                        (message: any) =>
                            message?.role === 'tool' &&
                            message?.toolCallId === toolCallId
                    );

                    if (existingIndex !== -1) {
                        const updated = [...state.messages];
                        updated[existingIndex] = {
                            ...updated[existingIndex],
                            content,
                            toolResult,
                            loading: !toolResult
                        };
                        return syncMessagesState(state, updated);
                    }

                    const newMessage = {
                        role: 'tool' as const,
                        content,
                        date: new Date().toISOString(),
                        toolCallId,
                        toolName,
                        toolArgs,
                        toolResult,
                        loading: !toolResult
                    } as any;

                    return syncMessagesState(
                        state,
                        [...state.messages, newMessage]
                    );
                }),

            // Complete tool message
            completeToolMessage: (toolCallId: string, toolResult: string) =>
                set((state: any) => {
                    const messageIndex = state.messages.findIndex(
                        (message: any) =>
                            message?.role === 'tool' &&
                            message?.toolCallId === toolCallId
                    );

                    if (messageIndex === -1) {
                        return {};
                    }

                    const updated = [...state.messages];
                    updated[messageIndex] = {
                        ...updated[messageIndex],
                        content: toolResult,
                        toolResult,
                        loading: false
                    };
                    return syncMessagesState(state, updated);
                }),

            // Reset tracker (call when starting new conversation turn)
            resetTracker: () => {
                set({ _currentTracker: {} });
            }
        }),
        {
            name: 'suggerence-gutenberg-assistant-state',
            storage: createJSONStorage(() =>
                (typeof window === 'undefined' || !window.localStorage)
                    ? fallbackStorage
                    : window.localStorage
            ),
            partialize: (state) => ({
                postId: state.postId
            }) as Pick<GutenbergAssistantMessagesStore, 'postId'>,
            onRehydrateStorage: () => (state) => {
                const normalizedPostId = normalizePostId(state?.postId ?? 0);
                const storedMessages = readMessagesForPost(normalizedPostId);
                state?.setMessages?.(storedMessages);
            }
        }
    )
);
