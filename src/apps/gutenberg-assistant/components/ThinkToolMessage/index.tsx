import {
    Reasoning,
    ReasoningTrigger,
    ReasoningContent
} from '@/components/ai-elements/reasoning';
import { useState, useEffect } from '@wordpress/element';
import { BrainIcon, ChevronDownIcon } from 'lucide-react';
import { __ } from '@wordpress/i18n';

interface ThinkToolMessageProps {
    message: MCPClientMessage;
}

export const ThinkToolMessage = ({ message }: ThinkToolMessageProps) => {
    const [thinkingContent, setThinkingContent] = useState<string>('');

    useEffect(() => {
        // Extract thinking content from tool args
        const toolArgs = (message as any).toolArgs;
        if (toolArgs && toolArgs.thinking) {
            setThinkingContent(toolArgs.thinking);
        }
    }, [message]);

    const isStreaming = message.loading;

    // Don't show if no thinking content
    if (!thinkingContent || thinkingContent.length === 0) {
        return null;
    }

    return (
        <Reasoning
            isStreaming={isStreaming}
            defaultOpen={true}
        >
            <ReasoningTrigger>
                <BrainIcon className="size-4" />
                <p>{__('Mid-execution reasoning', 'suggerence')}</p>
                <ChevronDownIcon className="size-4 transition-transform" />
            </ReasoningTrigger>
            <ReasoningContent>{thinkingContent}</ReasoningContent>
        </Reasoning>
    );
};
