import { __ } from '@wordpress/i18n';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useConversationsStore } from '../../stores/conversations';

export const ChatHeader = () => {
    const { clearConversation, currentConversationId } = useConversationsStore();

    const handleClear = () => {
        if (currentConversationId) {
            clearConversation(currentConversationId);
        }
    };

    return (
        <div className="flex items-center justify-between px-4 py-2 border-b border-border/30">
            <h3 className="text-sm font-semibold text-foreground m-0">
                {__("Chat", "suggerence")}
            </h3>
            {currentConversationId && (
                <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={handleClear}
                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    aria-label={__("Clear conversation", "suggerence")}
                >
                    <Trash2 className="size-4" />
                </Button>
            )}
        </div>
    );
};
