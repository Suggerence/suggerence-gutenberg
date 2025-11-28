import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface ConversationsStore
{
    conversations: Conversation[];

    getConversation: (blockId: string) => Conversation | undefined;

    addConversation: (blockId: string) => void;

    deleteConversation: (blockId: string) => void;

    clearConversation: (blockId: string) => void;

    setAiEditingFile: (blockId: string, aiEditingFile: string | null) => void;

    setSelectedFilePath: (blockId: string, selectedFilePath: string | null) => void;

    setStreamedCode: (blockId: string, streamedCode: string | null) => void;

    incrementTotalLinesWritten: (blockId: string, lines: number) => void;

    addMessage: (blockId: string, message: Message) => void;

    updateMessage: (blockId: string, messageId: string, updates: Partial<Message>) => void;

    deleteMessage: (blockId: string, messageIndex: number) => void;

    clearAllConversations: () => void;
}

export const useConversationsStore = create<ConversationsStore>()(
    persist(
        (set, get) => ({
            conversations: [],

            getConversation: (blockId: string) =>
            {
                return get().conversations.find(conversation => conversation.blockId === blockId);
            },

            addConversation: (blockId: string) =>
            {
                const exists = get().conversations.some(conversation => conversation.blockId === blockId);
                if (exists) return;

                set((state) => ({
                    conversations: [...state.conversations, { blockId, aiEditingFile: null, selectedFilePath: null, streamedCode: null, totalLinesWritten: 0, messages: [] }]
                }));
            },

            deleteConversation: (blockId: string) =>
            {
                set((state) => ({
                    conversations: state.conversations.filter(conversation => conversation.blockId !== blockId)
                }));
            },

            clearConversation: (blockId: string) =>
            {
                set((state) => ({
                    conversations: state.conversations.map(conversation => conversation.blockId === blockId ? { ...conversation, messages: [] } : conversation)
                }));
            },

            setAiEditingFile: (blockId: string, aiEditingFile: string | null) =>
            {
                set((state) => ({
                    conversations: state.conversations.map(conversation => conversation.blockId === blockId ? { ...conversation, aiEditingFile } : conversation)
                }));
            },

            setSelectedFilePath: (blockId: string, selectedFilePath: string | null) =>
            {
                set((state) => ({
                    conversations: state.conversations.map(conversation => conversation.blockId === blockId ? { ...conversation, selectedFilePath } : conversation)
                }));
            },
            
            setStreamedCode: (blockId: string, streamedCode: string | null) =>
            {
                // Only keep the latest 20 lines to save memory
                let trimmedCode = streamedCode;
                if (streamedCode && streamedCode.trim() !== '') {
                    const lines = streamedCode.split('\n');
                    if (lines.length > 20) {
                        trimmedCode = lines.slice(-20).join('\n');
                    }
                }

                set((state) => ({
                    conversations: state.conversations.map(conversation => conversation.blockId === blockId ? { ...conversation, streamedCode: trimmedCode } : conversation)
                }));
            },

            incrementTotalLinesWritten: (blockId: string, lines: number) =>
            {
                set((state) => ({
                    conversations: state.conversations.map(conversation => {
                        if (conversation.blockId === blockId) {
                            return { ...conversation, totalLinesWritten: (conversation.totalLinesWritten ?? 0) + lines };
                        }
                        return conversation;
                    })
                }));
            },

            addMessage: (blockId: string, message: Message) =>
            {
                set((state) => {                    
                    const exists =  state.conversations.find(conversation => conversation.blockId === blockId);

                    if (!exists) return {
                        conversations: [...state.conversations, { blockId, aiEditingFile: null, selectedFilePath: null, streamedCode: null, totalLinesWritten: 0, messages: [message] }]
                    }

                    return {
                        conversations: state.conversations.map(conversation => conversation.blockId === blockId ? { ...conversation, messages: [...conversation.messages, message] } : conversation)
                    };
                });
            },

            updateMessage: (blockId: string, messageId: string, updates: Partial<Message>) =>
            {
                set((state) => {
                    return {
                        conversations: state.conversations.map(conversation => {
                            if (conversation.blockId !== blockId) return conversation;
                            
                            const messageIndex = conversation.messages.findIndex(msg => msg.id === messageId);
                            if (messageIndex === -1) {
                                console.warn(`Message with id ${messageId} not found in conversation ${blockId}`);
                                return conversation;
                            }
                            
                            return {
                                ...conversation,
                                messages: conversation.messages.map((message, index) => index === messageIndex ? { ...message, ...updates } : message)
                            };
                        })
                    };
                });
            },

            deleteMessage: (blockId: string, messageIndex: number) =>
            {
                set((state) => ({
                    conversations: state.conversations.map(conversation => conversation.blockId === blockId ? { ...conversation, messages: conversation.messages.filter((_, index) => index !== messageIndex) } : conversation)
                }));
            },

            clearAllConversations: () =>
            {
                set({ conversations: [] });
            }
        }),
        {
            name: 'suggerence-blocks-conversations',
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                conversations: state.conversations.map(({ streamedCode, ...conversation }) => conversation)
            }),
        }
    )
);