import {
    Reasoning,
    ReasoningTrigger,
    ReasoningContent
} from '@/components/ai-elements/reasoning';
import { useThinkingContentStore } from '@/components/ai-elements/thinking-content-store';

export const ThinkingMessage = ({ message }: {message: MCPClientMessage}) => {
    const thinkingDuration = (message as any).thinkingDuration;
    const isStreaming = message.loading;
    const content = useThinkingContentStore((state) => state.content);

    return (!isStreaming && (!content || content.length === 0)) ? null : (
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