import { Response } from '@/components/ai-elements/response';
import { BotMessageSquare, Loader2 } from 'lucide-react';

export const AssistantMessage = ({message}: {message: MCPClientMessage}) => {
    const isLoading = message.loading;
    const hasContent = message.content && message.content.length > 0;

    return (
        <div className="flex items-start gap-3">
            <BotMessageSquare className="w-4 h-4 flex-shrink-0 text-muted-foreground mt-0.5" />
            <div className="flex-1 space-y-2">
                {/* Show content if present */}
                {hasContent && (
                    <Response
                        parseIncompleteMarkdown={true}
                        className="text-sm leading-relaxed text-foreground assistant-message prose prose-sm dark:prose-invert max-w-none"
                    >
                        {message.content}
                    </Response>
                )}

                {/* Show loading indicator if no content yet */}
                {isLoading && !hasContent && (
                    <div className="flex items-center gap-2">
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">Generating response...</span>
                    </div>
                )}
            </div>
        </div>
    );
};