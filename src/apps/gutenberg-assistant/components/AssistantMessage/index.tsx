import {
    __experimentalVStack as VStack,
    __experimentalText as Text,
    __experimentalHStack as HStack
} from '@wordpress/components';

export const AssistantMessage = ({message}: {message: MCPClientMessage}) => {
    const messageDate = new Date(message.date);
    const timeString = messageDate.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
    });

    return (
        <div style={{ paddingRight: '2rem', maxWidth: '85%' }}>
            <VStack spacing={1} justify="start">
                <div
                    style={{
                        padding: '10px 14px',
                        backgroundColor: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '12px 12px 12px 4px',
                        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
                    }}
                >
                    <Text
                        size="14"
                        lineHeight={1.6}
                        style={{
                            overflowWrap: 'anywhere',
                            color: '#1e293b',
                            whiteSpace: 'pre-wrap'
                        }}
                    >
                        {message.content}
                    </Text>
                </div>

                <HStack justify="space-between" style={{ width: '100%', paddingLeft: '4px' }}>
                    <Text variant="muted" size="11">
                        {timeString}
                    </Text>

                    {message.aiModel && (
                        <Text
                            variant="muted"
                            size="10"
                            style={{
                                backgroundColor: '#f1f5f9',
                                padding: '3px 8px',
                                borderRadius: '4px',
                                color: '#64748b',
                                fontWeight: '500',
                                letterSpacing: '0.3px'
                            }}
                        >
                            {message.aiModel}
                        </Text>
                    )}
                </HStack>
            </VStack>
        </div>
    );
};