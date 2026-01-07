import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Message } from '../types/message';

interface Conversation {
    conversationId: string;
    messages: Message[];
}

interface ConversationsStore {
    conversations: Conversation[];
    currentConversationId: string | null;

    getConversation: (conversationId: string) => Conversation | undefined;
    getCurrentConversation: () => Conversation | undefined;
    addConversation: (conversationId: string) => void;
    setCurrentConversation: (conversationId: string | null) => void;
    deleteConversation: (conversationId: string) => void;
    clearConversation: (conversationId: string) => void;
    addMessage: (conversationId: string, message: Message) => void;
    updateMessage: (conversationId: string, messageId: string, updates: Partial<Message>) => void;
    deleteMessage: (conversationId: string, messageIndex: number) => void;
    clearAllConversations: () => void;
}

export const useConversationsStore = create<ConversationsStore>()(
    persist(
        (set, get) => ({
            conversations: [],
            currentConversationId: null,

            getConversation: (conversationId: string) => {
                return get().conversations.find(conversation => conversation.conversationId === conversationId);
            },

            getCurrentConversation: () => {
                const { currentConversationId, conversations } = get();
                if (!currentConversationId) return undefined;
                return conversations.find(conversation => conversation.conversationId === currentConversationId);
            },

            addConversation: (conversationId: string) => {
                const exists = get().conversations.some(conversation => conversation.conversationId === conversationId);
                if (exists) return;

                set((state) => ({
                    conversations: [...state.conversations, { conversationId, messages: [] }],
                    currentConversationId: conversationId
                }));
            },

            setCurrentConversation: (conversationId: string | null) => {
                set({ currentConversationId: conversationId });
            },

            deleteConversation: (conversationId: string) => {
                set((state) => ({
                    conversations: state.conversations.filter(conversation => conversation.conversationId !== conversationId),
                    currentConversationId: state.currentConversationId === conversationId ? null : state.currentConversationId
                }));
            },

            clearConversation: (conversationId: string) => {
                set((state) => ({
                    conversations: state.conversations.map(conversation => 
                        conversation.conversationId === conversationId 
                            ? { ...conversation, messages: [] } 
                            : conversation
                    )
                }));
            },

            addMessage: (conversationId: string, message: Message) => {
                set((state) => {
                    const exists = state.conversations.find(conversation => conversation.conversationId === conversationId);

                    if (!exists) {
                        return {
                            conversations: [...state.conversations, { conversationId, messages: [message] }],
                            currentConversationId: conversationId
                        };
                    }

                    return {
                        conversations: state.conversations.map(conversation =>
                            conversation.conversationId === conversationId
                                ? { ...conversation, messages: [...conversation.messages, message] }
                                : conversation
                        )
                    };
                });
            },

            updateMessage: (conversationId: string, messageId: string, updates: Partial<Message>) => {
                set((state) => {
                    return {
                        conversations: state.conversations.map(conversation => {
                            if (conversation.conversationId !== conversationId) return conversation;

                            const messageIndex = conversation.messages.findIndex(msg => msg.id === messageId);
                            if (messageIndex === -1) {
                                console.warn(`Message with id ${messageId} not found in conversation ${conversationId}`);
                                return conversation;
                            }

                            return {
                                ...conversation,
                                messages: conversation.messages.map((message, index) =>
                                    index === messageIndex ? { ...message, ...updates } : message
                                )
                            };
                        })
                    };
                });
            },

            deleteMessage: (conversationId: string, messageIndex: number) => {
                set((state) => ({
                    conversations: state.conversations.map(conversation =>
                        conversation.conversationId === conversationId
                            ? { ...conversation, messages: conversation.messages.filter((_, index) => index !== messageIndex) }
                            : conversation
                    )
                }));
            },

            clearAllConversations: () => {
                set({ conversations: [], currentConversationId: null });
            }
        }),
        {
            name: 'suggerence-theme-editor-conversations',
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                conversations: state.conversations,
                currentConversationId: state.currentConversationId
            }),
        }
    )
);
