import { nanoid } from 'nanoid';
import { useCallback } from '@wordpress/element';
import { useConversationsStore } from '../stores/conversations';
import { useWebsocketStore } from '../stores/websocket';
import type { TextMessage } from '../types/message';

export const useSendMessage = () => {
    const { getCurrentConversation, addConversation, addMessage, currentConversationId, setCurrentConversation } = useConversationsStore();
    const { send: sendWebsocketMessage, connected } = useWebsocketStore();

    const sendMessage = useCallback(async (text: string, addFrontendMessage: boolean = true) => {
        const trimmedText = text.trim();
        if (!trimmedText || !connected) return;

        // Get or create conversation
        let conversationId = currentConversationId;
        
        if (!conversationId) {
            conversationId = crypto.randomUUID();
            addConversation(conversationId);
            setCurrentConversation(conversationId);
        }

        const conversation = getCurrentConversation();
        if (!conversation) {
            addConversation(conversationId);
        }

        // Add user message to conversation
        const userMessage: TextMessage = {
            id: nanoid(),
            createdAt: new Date().toISOString(),
            type: 'message',
            content: {
                text: trimmedText
            }
        };

        if (addFrontendMessage) {
            addMessage(conversationId!, userMessage);
        }

        // Send message via WebSocket
        sendWebsocketMessage('message', {
            conversationId: conversationId,
            message: trimmedText,
            conversation: conversation?.messages || []
        });
    }, [currentConversationId, connected, getCurrentConversation, addConversation, addMessage, setCurrentConversation, sendWebsocketMessage]);

    return { sendMessage };
};
