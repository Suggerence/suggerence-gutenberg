import { useState, useRef, useEffect, useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import type { KeyboardEvent } from 'react';
import { MessageCircle, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useSendMessage } from '../../hooks/useSendMessage';
import { useWebsocketStore } from '../../stores/websocket';

export const InputArea = () => {
    const [inputValue, setInputValue] = useState('');
    const { sendMessage } = useSendMessage();
    const { connected } = useWebsocketStore();
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        textareaRef.current?.focus();
    }, []);

    const handleKeyDown = useCallback((event: KeyboardEvent<HTMLTextAreaElement>) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            if (inputValue.trim() && connected) {
                void sendMessage(inputValue);
                setInputValue('');
            }
        }
    }, [inputValue, connected, sendMessage]);

    const handleSend = useCallback(() => {
        if (inputValue.trim() && connected) {
            void sendMessage(inputValue);
            setInputValue('');
            textareaRef.current?.focus();
        }
    }, [inputValue, connected, sendMessage]);

    const canSend = connected && inputValue.trim().length > 0;

    return (
        <div className="border-t border-border/50 p-4 bg-card/50">
            <div className="flex items-end gap-2">
                <textarea
                    ref={textareaRef}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={connected ? __("Ask me anything about your site...", "suggerence") : __("Connecting...", "suggerence")}
                    disabled={!connected}
                    className={cn(
                        "flex-1 min-h-[60px] max-h-[120px]",
                        "px-3 py-2 rounded-lg",
                        "bg-background border border-border",
                        "text-sm text-foreground placeholder:text-muted-foreground",
                        "resize-none focus:outline-none focus:ring-2 focus:ring-primary/50",
                        "sugg-scrollbar",
                        !connected && "opacity-50 cursor-not-allowed"
                    )}
                    rows={2}
                />
                <Button
                    size="icon"
                    onClick={handleSend}
                    disabled={!canSend}
                    className="h-[60px] w-[60px] rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
                    aria-label={__("Send message", "suggerence")}
                >
                    {connected ? (
                        <Send className="size-5" />
                    ) : (
                        <MessageCircle className="size-5" />
                    )}
                </Button>
            </div>
            <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                <span>{__("Press Enter to send, Shift+Enter for new line", "suggerence")}</span>
                {!connected && (
                    <span className="text-yellow-600 dark:text-yellow-400">
                        {__("(Connecting...)", "suggerence")}
                    </span>
                )}
            </div>
        </div>
    );
};
