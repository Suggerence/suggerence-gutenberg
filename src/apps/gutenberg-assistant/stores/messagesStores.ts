import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

const initialMessages = [] as MCPClientMessage[];

// Message type identifiers for tracking
type MessageTracker = {
    thinking?: number;  // Index of current thinking message
    content?: number;   // Index of current content message
    tool?: number;      // Index of current tool message
};

// Unified store with message management and conversation state
export const useGutenbergAssistantMessagesStore = create<GutenbergAssistantMessagesStore>()(
    persist(
        (set, get) => ({
            postId: 0,
            setPostId: (postId: number) => set({ postId }),
            messages: initialMessages,
            setMessages: (messages: MCPClientMessage[]) => set({ messages }),
            setLastMessage: (message: MCPClientMessage) => set((state: any) => ({ messages: [...state.messages.slice(0, -1), message] })),
            addMessage: (message: MCPClientMessage) => set((state: any) => ({ messages: [...state.messages, message] })),
            clearMessages: () => set({ messages: initialMessages }),

            // Conversation state (not persisted)
            isLoading: false,
            setIsLoading: (isLoading: boolean) => set({ isLoading }),
            abortController: null,
            setAbortController: (abortController: AbortController | null) => set({ abortController }),

            // Message tracker for current streaming messages
            _currentTracker: {} as MessageTracker,

            // Start or update thinking message
            upsertThinkingMessage: (content: string, aiModel: string) => {
                const state = get();
                const tracker = state._currentTracker;

                if (tracker.thinking !== undefined) {
                    // Update existing
                    const updated = [...state.messages];
                    updated[tracker.thinking] = {
                        ...updated[tracker.thinking],
                        content,
                        loading: true
                    };
                    set({ messages: updated });
                } else {
                    // Create new
                    const newMessage = {
                        role: 'thinking' as const,
                        content,
                        date: new Date().toISOString(),
                        aiModel,
                        loading: true
                    };
                    set({
                        messages: [...state.messages, newMessage],
                        _currentTracker: { ...tracker, thinking: state.messages.length }
                    });
                }
            },

            // Complete thinking message
            completeThinkingMessage: (thinkingDuration?: number, thinkingSignature?: string) => {
                const state = get();
                const tracker = state._currentTracker;

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

                if (thinkingIndex !== undefined) {
                    const updated = [...state.messages];
                    const existing = updated[thinkingIndex] as any;

                    const finalDuration = thinkingDuration ?? existing?.thinkingDuration;
                    const finalSignature = thinkingSignature ?? existing?.thinkingSignature;
                    const finalContent = typeof existing?.content === 'string' ? existing.content : existing?.content?.toString?.() || '';

                    // If there's no thinking content and no signature, drop the placeholder message entirely
                    if (!finalSignature && finalContent.trim().length === 0) {
                        const cleanedMessages = updated.filter((_, index) => index !== thinkingIndex);
                        set({
                            messages: cleanedMessages,
                            _currentTracker: { ...tracker, thinking: undefined }
                        });
                        return;
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

                    set({
                        messages: updated,
                        _currentTracker: nextTracker
                    });
                }
            },

            // Start or update content message
            // Content messages don't have loading states - they just stream and complete
            upsertContentMessage: (content: string, aiModel: string) => {
                const state = get();
                const tracker = state._currentTracker;

                if (tracker.content !== undefined) {
                    // Update existing
                    const updated = [...state.messages];
                    updated[tracker.content] = {
                        ...updated[tracker.content],
                        content
                    };
                    set({ messages: updated });
                } else {
                    // Create new
                    const newMessage = {
                        role: 'assistant' as const,
                        content,
                        date: new Date().toISOString(),
                        aiModel
                    };
                    set({
                        messages: [...state.messages, newMessage],
                        _currentTracker: { ...tracker, content: state.messages.length }
                    });
                }
            },

            // Start or update tool message
            upsertToolMessage: (toolCallId: string, toolName: string, toolArgs: any, content: string, toolResult?: string) => {
                const state = get();
                const tracker = state._currentTracker;

                if (tracker.tool !== undefined) {
                    // Update existing
                    const updated = [...state.messages];
                    updated[tracker.tool] = {
                        ...updated[tracker.tool],
                        content,
                        toolResult,
                        loading: !toolResult
                    };
                    set({ messages: updated });
                } else {
                    // Create new
                    const newMessage = {
                        role: 'tool' as const,
                        content,
                        date: new Date().toISOString(),
                        toolCallId,
                        toolName,
                        toolArgs,
                        toolResult,
                        loading: true
                    } as any;
                    set({
                        messages: [...state.messages, newMessage],
                        _currentTracker: { ...tracker, tool: state.messages.length }
                    });
                }
            },

            // Complete tool message
            completeToolMessage: (toolResult: string) => {
                const state = get();
                const tracker = state._currentTracker;

                if (tracker.tool !== undefined) {
                    const updated = [...state.messages];
                    updated[tracker.tool] = {
                        ...updated[tracker.tool],
                        content: toolResult,
                        toolResult,
                        loading: false
                    };
                    set({
                        messages: updated,
                        _currentTracker: { ...tracker, tool: undefined }
                    });
                }
            },

            // Reset tracker (call when starting new conversation turn)
            resetTracker: () => {
                set({ _currentTracker: {} });
            }
        }),
        {
            name: 'suggerence-gutenberg-assistant-messages',
            storage: createJSONStorage(() => sessionStorage),
            partialize: (state) => ({
                postId: state.postId,
                messages: state.messages
            }) as Pick<GutenbergAssistantMessagesStore, 'postId' | 'messages'>
        }
    )
);
