import { __ } from '@wordpress/i18n';
import { MessageCircle, Wrench, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import type { Message } from '../../types/message';
import { truncateJsonToMaxLines, truncateToMaxLines } from '@/shared/utils/truncate-text';

interface MessageBubbleProps {
    message: Message;
}

export const MessageBubble = ({ message }: MessageBubbleProps) => {
    const isUser = message.type === 'message';
    const isResponse = message.type === 'response';
    const isReasoning = message.type === 'reasoning';
    const isToolCall = message.type === 'tool_call';

    if (isUser) {
        return (
            <div className="flex items-start gap-3 justify-end">
                <div className="flex-1 space-y-1 text-right">
                    <div className="text-xs text-muted-foreground font-medium">
                        {__("You", "suggerence")}
                    </div>
                    <div className="text-sm text-primary-foreground bg-primary rounded-lg p-3 inline-block max-w-[80%]">
                        {message.content.text}
                    </div>
                </div>
                <div className="size-8 rounded-full bg-primary flex items-center justify-center shrink-0">
                    <span className="text-xs text-primary-foreground font-semibold">U</span>
                </div>
            </div>
        );
    }

    if (isResponse) {
        return (
            <div className="flex items-start gap-3">
                <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <MessageCircle className="size-4 text-primary" />
                </div>
                <div className="flex-1 space-y-1">
                    <div className="text-xs text-muted-foreground font-medium">
                        {__("AI Assistant", "suggerence")}
                    </div>
                    <div className="text-sm text-foreground bg-muted/50 rounded-lg p-3 max-w-[85%]">
                        {message.content.text}
                    </div>
                </div>
            </div>
        );
    }

    if (isReasoning) {
        return (
            <div className="flex items-start gap-3 opacity-70">
                <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <MessageCircle className="size-4 text-primary" />
                </div>
                <div className="flex-1 space-y-1">
                    <div className="text-xs text-muted-foreground font-medium">
                        {__("AI Assistant", "suggerence")} ({__("Thinking", "suggerence")})
                    </div>
                    <div className="text-sm text-foreground bg-muted/30 rounded-lg p-3 max-w-[85%] italic">
                        {message.content.chunk}
                    </div>
                </div>
            </div>
        );
    }

    if (isToolCall) {
        const toolCall = message.content;
        const status = toolCall.status || 'pending';
        const isPending = status === 'pending';
        const isSuccess = status === 'success';
        const isError = status === 'error';

        return (
            <div className="flex items-start gap-3">
                <div className={`size-8 rounded-full flex items-center justify-center shrink-0 ${
                    isPending ? 'bg-primary/10' : isSuccess ? 'bg-green-500/10' : 'bg-destructive/10'
                }`}>
                    {isPending ? (
                        <Loader2 className="size-4 text-primary animate-spin" />
                    ) : isSuccess ? (
                        <CheckCircle2 className="size-4 text-green-500" />
                    ) : (
                        <XCircle className="size-4 text-destructive" />
                    )}
                </div>
                <div className="flex-1 space-y-1">
                    <div className="text-xs text-muted-foreground font-medium flex items-center gap-2">
                        <Wrench className="size-3" />
                        {__("Tool Call", "suggerence")}: {toolCall.name}
                    </div>
                    <div className={`text-sm rounded-lg p-3 max-w-[85%] ${
                        isPending ? 'bg-muted/30' : isSuccess ? 'bg-green-500/10 border border-green-500/20' : 'bg-destructive/10 border border-destructive/20'
                    }`}>
                        <div className="font-mono text-xs mb-2 break-words">
                            <div className="text-xs text-muted-foreground mb-1 font-semibold">
                                {__("Arguments", "suggerence")}:
                            </div>
                            <pre className="whitespace-pre-wrap break-words overflow-x-auto">{truncateJsonToMaxLines(toolCall.arguments, 10)}</pre>
                        </div>
                        {isPending && (
                            <div className="text-xs text-muted-foreground italic">
                                {__("Waiting for frontend response...", "suggerence")}
                            </div>
                        )}
                        {isSuccess && toolCall.result !== undefined && (
                            <div className="mt-3 pt-3 border-t border-green-500/20">
                                <div className="text-xs text-muted-foreground mb-1 font-semibold">
                                    {__("Result", "suggerence")}:
                                </div>
                                <div className="font-mono text-xs break-words">
                                    <pre className="whitespace-pre-wrap break-words overflow-x-auto">
                                        {typeof toolCall.result === 'string' 
                                            ? truncateToMaxLines(toolCall.result, 10)
                                            : truncateJsonToMaxLines(toolCall.result, 10)}
                                    </pre>
                                </div>
                            </div>
                        )}
                        {isError && toolCall.error && (
                            <div className="text-xs text-destructive">
                                {__("Error", "suggerence")}: {toolCall.error}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return null;
};
