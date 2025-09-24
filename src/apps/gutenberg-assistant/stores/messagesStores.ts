import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

const initialMessages = [
    {
        role: 'assistant',
        content: 'Hello! I\'m your Gutenberg AI assistant. I can help you create paragraphs, add headings, generate lists, move blocks, and much more. Just tell me what you\'d like to do with your content!',
        date: new Date().toISOString()
    }
] as MCPClientMessage[];

// Persistent version
export const useGutenbergAssistantMessagesStore = create<GutenbergAssistantMessagesStore>()(
    persist(
        (set: any, get: any) => ({
            postId: 0,
            setPostId: (postId: number) => set({ postId }),
            messages: initialMessages,
            setMessages: (messages: MCPClientMessage[]) => set({ messages }),
            setLastMessage: (message: MCPClientMessage) => set((state: any) => ({ messages: [...state.messages.slice(0, -1), message] })),
            addMessage: (message: MCPClientMessage) => set((state: any) => ({ messages: [...state.messages, message] })),
            clearMessages: () => set({ messages: initialMessages }),
        }),
        {
            name: 'suggerence-gutenberg-assistant-messages',
            storage: createJSONStorage(() => sessionStorage)
        }
    )
);
