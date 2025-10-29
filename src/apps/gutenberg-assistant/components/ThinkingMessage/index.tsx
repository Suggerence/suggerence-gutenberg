import {
    Reasoning,
    ReasoningTrigger,
    ReasoningContent
} from '@/components/ai-elements/reasoning';
import { useThinkingContentStore } from '@/components/ai-elements/thinking-content-store';

interface ThinkingMessageProps {
    message: MCPClientMessage;
}

export const ThinkingMessage = ({ message }: ThinkingMessageProps) => {
    const thinkingDuration = (message as any).thinkingDuration;
    const isStreaming = message.loading;
    const content = useThinkingContentStore((state) => state.content);

    // Show the component if streaming or if there's content in the store
    if (!isStreaming && (!content || content.length === 0)) {
        return null;
    }

    return (
        <Reasoning
            isStreaming={isStreaming}
            defaultOpen={true}
            duration={thinkingDuration}
        >
            <ReasoningTrigger />
            <ReasoningContent />
        </Reasoning>
    );
};