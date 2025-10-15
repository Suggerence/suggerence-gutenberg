import { __experimentalVStack as VStack, __experimentalText as Text, __experimentalHStack as HStack } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { Response } from '@/components/ai-elements/response';

interface ThinkingMessageProps {
    message: MCPClientMessage;
    thinkingText: string;
    completedText: string;
}

export const ThinkingMessage = ({ message, thinkingText, completedText }: ThinkingMessageProps) => {
    const isLoading = message.loading;
    const isError = message.toolResult === 'error';

    // Check if tool result has success: false
    let isToolFailure = false;
    if (message.toolResult && typeof message.toolResult === 'string') {
        try {
            const parsedResult = JSON.parse(message.toolResult);
            isToolFailure = parsedResult && parsedResult.success === false;
        } catch (e) {
            // If parsing fails, treat as regular string result
        }
    } else if (message.toolResult && typeof message.toolResult === 'object') {
        isToolFailure = message.toolResult.success === false;
    }

    const hasError = isError || isToolFailure;

    return (
        <div style={{ width: '100%' }}>
            <HStack justify="start" alignment="center">
                {isLoading ? (
                    <Loader2
                        size={16}
                        style={{
                            animation: 'spin 1s linear infinite',
                            color: '#64748b',
                            flexShrink: 0
                        }}
                    />
                ) : hasError ? (
                    <XCircle size={16} style={{ color: '#ef4444', flexShrink: 0 }} />
                ) : (
                    <CheckCircle2 size={16} style={{ color: '#10b981', flexShrink: 0 }} />
                )}
                {/* <Dot size={16} style={{ color: '#10b981', flexShrink: 0 }} /> */}

                <Response
                    parseIncompleteMarkdown={true}
                    className="text-sm leading-relaxed text-gray-600 thinking-message"
                >
                    {isLoading ? thinkingText : completedText}
                </Response>
            </HStack>

            <style>
                {`
                    @keyframes spin {
                        from { transform: rotate(0deg); }
                        to { transform: rotate(360deg); }
                    }
                `}
            </style>
        </div>
    );
};
