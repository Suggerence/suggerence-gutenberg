import { Response } from '@/components/ai-elements/response';
import { BotMessageSquare } from 'lucide-react';
import { __experimentalHStack as HStack } from '@wordpress/components';

export const AssistantMessage = ({message}: {message: MCPClientMessage}) => {
    return (
        <HStack justify="start" alignment="start">
            <BotMessageSquare size={16} style={{ flexShrink: 0 }} />
            <Response
                parseIncompleteMarkdown={true}
                className="text-sm leading-relaxed text-gray-600 assistant-message"
            >
                {message.content}
            </Response>
        </HStack>
    );
};