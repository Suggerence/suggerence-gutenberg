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
        <div style={{ paddingRight: '1rem' }}>
            <VStack spacing={1} justify="start">
                <div style={{ padding: '8px 12px', backgroundColor: '#f7f7f7', border: '1px solid #ddd' }}>
                    <Text size="14" lineHeight={1.5} style={{ overflowWrap: 'anywhere' }}>
                        {message.content}
                    </Text>
                </div>

                <HStack justify="space-between" style={{ width: '100%' }}>
                    <Text variant="muted" size="11">
                        {timeString}
                    </Text>

                    {message.aiModel && (
                        <Text variant="muted" size="10" style={{ backgroundColor: '#f0f0f0', padding: '2px 6px' }}>
                            {message.aiModel}
                        </Text>
                    )}
                </HStack>
            </VStack>
        </div>
    );
};