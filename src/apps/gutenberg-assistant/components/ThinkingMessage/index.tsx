import { __experimentalVStack as VStack, __experimentalText as Text, __experimentalHStack as HStack } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';

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

    const messageDate = new Date(message.date);
    const timeString = messageDate.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
    });

    const hasError = isError || isToolFailure;

    return (
        <div style={{ width: '100%' }}>
            <VStack spacing={1} justify="start">
                <div style={{ paddingRight: '2rem', maxWidth: '85%' }}>
                    <HStack justify="start" spacing={2} alignment="center">
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

                        <div
                            style={{
                                padding: '8px 12px',
                                backgroundColor: hasError ? '#fef2f2' : '#f8fafc',
                                border: `1px solid ${hasError ? '#fecaca' : '#e2e8f0'}`,
                                borderRadius: '8px',
                                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.04)'
                            }}
                        >
                            <Text
                                variant="muted"
                                style={{
                                    fontStyle: 'italic',
                                    fontSize: '13px',
                                    color: hasError ? '#dc2626' : '#64748b',
                                    lineHeight: '1.4'
                                }}
                            >
                                {isLoading ? thinkingText : completedText}
                            </Text>
                        </div>
                    </HStack>
                </div>

                <Text variant="muted" size="11" style={{ paddingLeft: '4px' }}>
                    {timeString}
                </Text>
            </VStack>

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
