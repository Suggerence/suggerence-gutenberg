import { Loader2, CheckCircle2, XCircle } from 'lucide-react';

export const ActionMessage = ({ message, initialText, completedText }: ActionMessageProps) => {
    const isLoading = message.loading;
    let hasError = message.toolResult === 'error';

    if(!isLoading && !hasError) {
        if (message.toolResult && typeof message.toolResult === 'string') {
            try {
                const parsedResult = JSON.parse(message.toolResult);
                hasError = parsedResult && parsedResult.success === false;
            } catch (e) {
                hasError = true;
            }
        } else if (message.toolResult && typeof message.toolResult === 'object') {
            hasError = message.toolResult.success === false;
        }
    }

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
                {isLoading ? initialText : completedText}
            </span>
        </div>
    );
};
