import { __experimentalVStack as VStack, __experimentalText as Text } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

export const UserMessage = ({message}: {message: MCPClientMessage}) => {
    const messageDate = new Date(message.date);
    const timeString = messageDate.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
    });

    return (
        <div style={{ paddingLeft: '1rem', marginLeft: 'auto' }}>
            <VStack spacing={1} justify="end">
                <div
                    style={{
                        padding: '8px 12px',
                        backgroundColor: '#0073aa',
                        color: 'white'
                    }}
                >
                    <Text color="white" size="14" style={{ overflowWrap: 'anywhere' }}>
                        {message.content}
                    </Text>
                </div>

                <Text variant="muted" size="11">
                    {timeString}
                </Text>
            </VStack>
        </div>
    );
};