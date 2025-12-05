import {
    Reasoning,
    ReasoningTrigger,
    ReasoningContent
} from '@/components/ai-elements/reasoning';

export const ThinkingMessage = ({ message }: {message: MCPClientMessage}) => {
    const thinkingDuration = (message as any).thinkingDuration;
    const isStreaming = message.loading;
    const displayContent = typeof message.content === 'string' ? message.content : '';

    return (!isStreaming && displayContent.length === 0) ? null : (
        <Reasoning
            isStreaming={isStreaming}
            defaultOpen={true}
            duration={thinkingDuration}
        >
            <ReasoningTrigger />
            <ReasoningContent>
                {displayContent}
            </ReasoningContent>
        </Reasoning>
    );
};
