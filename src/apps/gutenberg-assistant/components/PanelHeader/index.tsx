import { __experimentalHStack as HStack, __experimentalText as Text, Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { update } from '@wordpress/icons';
import { useGutenbergAssistantMessagesStore } from '@/apps/gutenberg-assistant/stores/messagesStores';

export const PanelHeader = () => {
    const { clearMessages } = useGutenbergAssistantMessagesStore();

    return (
        <HStack justify="space-between" style={{ padding: '16px', borderBottom: '1px solid #ddd' }}>
            <Text weight="600">{__("AI Assistant", "suggerence")}</Text>
            <Button
                icon={update}
                onClick={clearMessages}
                size="small"
                label={__("Reset conversation", "suggerence")}
                showTooltip
            />
        </HStack>
    );
};