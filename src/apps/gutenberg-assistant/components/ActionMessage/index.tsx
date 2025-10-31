import { Loader2, CheckCircle2, XCircle } from 'lucide-react';

interface ActionMessageProps {
    message: MCPClientMessage;
    thinkingText: string;
    completedText: string;
}

export const ActionMessage = ({ message, thinkingText, completedText }: ActionMessageProps) => {
    const isLoading = message.loading;
    const isError = message.toolResult === 'error';

    // Check if tool result has success: false
    let isToolFailure = false;
    if (message.toolResult && typeof message.toolResult === 'string') {
        try {
            const parsedResult = JSON.parse(message.toolResult);
            isToolFailure = parsedResult && parsedResult.success === false;
        } catch (e) {
            // If parsing fails, treat as regular string result
        }
    } else if (message.toolResult && typeof message.toolResult === 'object') {
        isToolFailure = message.toolResult.success === false;
    }

    const hasError = isError || isToolFailure;

    return (
        <div className="w-full flex items-center gap-2 text-sm text-muted-foreground">
            {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
            ) : hasError ? (
                <XCircle className="w-4 h-4 text-destructive flex-shrink-0" />
            ) : (
                <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-500 flex-shrink-0" />
            )}
            <span>
                {isLoading ? thinkingText : completedText}
            </span>
        </div>
    );
};
