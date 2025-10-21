import { Response } from '@/components/ai-elements/response';
import { BotMessageSquare, Loader2 } from 'lucide-react';
import { __experimentalHStack as HStack, __experimentalVStack as VStack } from '@wordpress/components';

export const AssistantMessage = ({message}: {message: MCPClientMessage}) => {
    const isLoading = message.loading;
    const hasContent = message.content && message.content.length > 0;

    return (
        <HStack justify="start" alignment="start">
            <BotMessageSquare size={16} style={{ flexShrink: 0 }} />
            <VStack spacing={2} style={{ width: '100%' }}>
                {/* Show content if present */}
                {hasContent && (
                    <Response
                        parseIncompleteMarkdown={true}
                        className="text-sm leading-relaxed text-gray-600 assistant-message"
                    >
                        {message.content}
                    </Response>
                )}

                {/* Show loading indicator if no content yet */}
                {isLoading && !hasContent && (
                    <HStack justify="start" alignment="center">
                        <Loader2
                            size={14}
                            style={{
                                animation: 'spin 1s linear infinite',
                                color: '#64748b'
                            }}
                        />
                        <span style={{ fontSize: '12px', color: '#64748b' }}>Generating response...</span>
                    </HStack>
                )}
            </VStack>

            <style>
                {`
                    @keyframes spin {
                        from { transform: rotate(0deg); }
                        to { transform: rotate(360deg); }
                    }
                `}
            </style>
        </HStack>
    );
};