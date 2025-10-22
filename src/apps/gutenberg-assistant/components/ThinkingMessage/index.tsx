import {
    Reasoning,
    ReasoningTrigger,
    ReasoningContent
} from '@/components/ai-elements/reasoning';

interface ThinkingMessageProps {
    message: MCPClientMessage;
}

export const ThinkingMessage = ({ message }: ThinkingMessageProps) => {
    const thinking = message.content;  // Thinking content is stored in content field
    const thinkingDuration = (message as any).thinkingDuration;
    const isStreaming = message.loading;

    if (!thinking || thinking.length === 0) {
        return null;
    }

    return (
        <Reasoning
            isStreaming={isStreaming}
            defaultOpen={false}
            duration={thinkingDuration}
        >
            <ReasoningTrigger />
            <ReasoningContent>{thinking}</ReasoningContent>
        </Reasoning>
    );
};