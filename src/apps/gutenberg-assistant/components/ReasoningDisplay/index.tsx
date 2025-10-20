import {
    Reasoning,
    ReasoningTrigger,
    ReasoningContent
} from '@/components/ai-elements/reasoning';

interface ReasoningDisplayProps {
    thinking: string;
    isStreaming?: boolean;
}

/**
 * Displays AI reasoning/thinking process using AI SDK Elements
 * https://ai-sdk.dev/elements/components/reasoning
 *
 * The Reasoning component automatically tracks duration internally,
 * so we don't need to manage it here.
 */
export const ReasoningDisplay = ({ thinking, isStreaming = false }: ReasoningDisplayProps) => {
    if (!thinking || thinking.length === 0) {
        return null;
    }

    return (
        <Reasoning
            isStreaming={isStreaming}
            defaultOpen={true}
        >
            <ReasoningTrigger />
            <ReasoningContent>{thinking}</ReasoningContent>
        </Reasoning>
    );
};
