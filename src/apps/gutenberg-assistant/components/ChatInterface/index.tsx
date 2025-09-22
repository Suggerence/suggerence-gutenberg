import { useRef, useEffect } from '@wordpress/element';
import {
    PanelBody,
    Spinner,
    Notice,
    __experimentalText as Text,
    __experimentalHStack as HStack,
    __experimentalVStack as VStack,
} from '@wordpress/components';
import { useGutenbergMCP } from '@/apps/gutenberg-assistant/hooks/useGutenbergMcp';
import { __ } from '@wordpress/i18n';
import { PanelHeader } from '@/apps/gutenberg-assistant/components/PanelHeader';
import { UserMessage } from '@/apps/gutenberg-assistant/components/UserMessage';
import { ToolMessage } from '@/apps/gutenberg-assistant/components/ToolMessage';
import { AssistantMessage } from '@/apps/gutenberg-assistant/components/AssistantMessage';
import { useGutenbergAssistantMessagesStore } from '@/apps/gutenberg-assistant/stores/messagesStores';
import { useChatInterfaceStore } from '@/apps/gutenberg-assistant/stores/chatInterfaceStore';
import { InputArea } from '@/apps/gutenberg-assistant/components/InputArea';

export const ChatInterface = () => {
    const { isGutenbergServerReady } = useGutenbergMCP();
    const { messages } = useGutenbergAssistantMessagesStore();
    const { isLoading } = useChatInterfaceStore();
    const messagesEndRef = useRef<HTMLDivElement>(null);
    
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(scrollToBottom, [messages]);

    if (!isGutenbergServerReady) {
        return (
            <PanelBody>
                <Notice status="warning" isDismissible={false}>
                    <Text>{__("Connecting to Gutenberg AI. Please wait...", "suggerence")}</Text>
                </Notice>
            </PanelBody>
        );
    }

    return (
        <VStack spacing={0} style={{ height: '100%' }}>
            <PanelHeader />

            <VStack spacing={0} style={{ flex: 1, overflow: 'hidden' }}>
                <div style={{ flex: 1, overflowY: 'auto', padding: '0.5rem' }}>
                    <VStack spacing={4}>
                        {messages.map((message, index) => {
                            if (message.role === 'user') {
                                return (
                                    <UserMessage key={`${message.role}-${index}-${message.date}`} message={message} />
                                );
                            }

                            if (message.role === 'tool') {
                                return (
                                    <ToolMessage key={`${message.role}-${index}-${message.date}`} message={message} />
                                );
                            }

                            return (
                                <AssistantMessage key={`${message.role}-${index}-${message.date}`} message={message} />
                            );
                        })}

                        {isLoading && (
                            <HStack justify="start" spacing={2}>
                                <Spinner/>

                                <div style={{ padding: '8px 12px', backgroundColor: '#f7f7f7', border: '1px solid #ddd' }}>
                                    <Text variant="muted" style={{ fontStyle: 'italic' }}>
                                        {__("Processing your request...", "suggerence")}
                                    </Text>
                                </div>
                            </HStack>
                        )}

                        <div ref={messagesEndRef} />
                    </VStack>
                </div>

                <InputArea />
            </VStack>
        </VStack>
    );
};