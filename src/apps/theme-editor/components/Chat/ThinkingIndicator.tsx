import { __ } from '@wordpress/i18n';
import { MessageCircle } from 'lucide-react';
import { useWebsocketStore } from '../../stores/websocket';
import { useConversationsStore } from '../../stores/conversations';

export const ThinkingIndicator = () => {
    const { connected } = useWebsocketStore();
    const { getCurrentConversation } = useConversationsStore();
    const conversation = getCurrentConversation();
    
    // Show thinking indicator if:
    // 1. WebSocket is connected
    // 2. Last message is a user message (waiting for response)
    const lastMessage = conversation?.messages[conversation.messages.length - 1];
    const isThinking = connected && lastMessage?.type === 'message';

    if (!isThinking) return null;

    return (
        <div className="flex items-start gap-3 opacity-60">
            <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <MessageCircle className="size-4 text-primary" />
            </div>
            <div className="flex-1 space-y-1">
                <div className="text-xs text-muted-foreground font-medium">
                    {__("AI Assistant", "suggerence")}
                </div>
                <div className="text-sm text-foreground bg-muted/50 rounded-lg p-3 inline-flex items-center gap-1">
                    <span className="size-1.5 bg-foreground rounded-full animate-pulse" />
                    <span className="size-1.5 bg-foreground rounded-full animate-pulse delay-75" />
                    <span className="size-1.5 bg-foreground rounded-full animate-pulse delay-150" />
                </div>
            </div>
        </div>
    );
};
