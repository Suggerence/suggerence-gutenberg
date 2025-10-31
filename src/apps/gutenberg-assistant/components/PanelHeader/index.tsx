import { __ } from '@wordpress/i18n';
import { RotateCcw } from 'lucide-react';
import { useGutenbergAssistantMessagesStore } from '@/apps/gutenberg-assistant/stores/messagesStores';
import { Button } from '@/components/ui/button';

export const PanelHeader = () => {
    const { clearMessages } = useGutenbergAssistantMessagesStore();

    return (
        <div className="flex items-center justify-between p-4 border-b border-border bg-card">
            <h2 className="!text-base !font-semibold !text-foreground !m-0">{__("AI Assistant", "suggerence")}</h2>
            <Button
                variant="ghost"
                size="sm"
                onClick={clearMessages}
                title={__("Reset conversation", "suggerence")}
                className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
            >
                <RotateCcw className="h-4 w-4" />
            </Button>
        </div>
    );
};