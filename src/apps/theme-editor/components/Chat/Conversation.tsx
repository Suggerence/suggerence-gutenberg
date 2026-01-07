import { useRef, useEffect } from '@wordpress/element';
import { useConversationsStore } from '../../stores/conversations';
import { MessageBubble } from './MessageBubble';
import { ThinkingIndicator } from './ThinkingIndicator';
import type { Message } from '../../types/message';

export const Conversation = () => {
    const { getCurrentConversation } = useConversationsStore();
    const conversation = getCurrentConversation();
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const messages: Message[] = conversation?.messages || [];

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    if (messages.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <svg className="size-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                </div>
                <h3 className="text-sm font-semibold text-primary! mb-2">
                    Start a conversation
                </h3>
                <p className="text-xs text-muted-foreground">
                    Ask me anything about your WordPress site design and customization.
                </p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-4">
            {messages.map((message) => (
                <MessageBubble key={message.id} message={message} />
            ))}
            <ThinkingIndicator />
            <div ref={messagesEndRef} />
        </div>
    );
};
