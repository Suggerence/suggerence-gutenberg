import {
    Reasoning,
    ReasoningTrigger,
    ReasoningContent
} from '@/components/ai-elements/reasoning';
import { BrainIcon, ChevronDownIcon } from 'lucide-react';
import { __ } from '@wordpress/i18n';

export const ThinkToolMessage = ({ message }: {message: MCPClientMessage}) => {
    const isStreaming = message.loading;

    return (!message.toolArgs?.thinking || message.toolArgs.thinking.length === 0) ? null : (
        <Reasoning
            isStreaming={isStreaming}
            defaultOpen={true}
        >
            <ReasoningTrigger>
                <BrainIcon className="size-4" />
                <p>{__('Mid-execution reasoning', 'suggerence')}</p>
                <ChevronDownIcon className="size-4 transition-transform" />
            </ReasoningTrigger>
            <ReasoningContent>{message.toolArgs.thinking}</ReasoningContent>
        </Reasoning>
    );
};
