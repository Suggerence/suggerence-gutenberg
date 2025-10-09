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
import { ThinkingMessage } from '@/apps/gutenberg-assistant/components/ThinkingMessage';
import { AssistantMessage } from '@/apps/gutenberg-assistant/components/AssistantMessage';
import { useGutenbergAssistantMessagesStore } from '@/apps/gutenberg-assistant/stores/messagesStores';
import { useChatInterfaceStore } from '@/apps/gutenberg-assistant/stores/chatInterfaceStore';
import { InputArea } from '@/apps/gutenberg-assistant/components/InputArea';

export const ChatInterface = () => {
    const { isGutenbergServerReady } = useGutenbergMCP();
    const { messages } = useGutenbergAssistantMessagesStore();
    const { isLoading } = useChatInterfaceStore();

    const messagesEndRef = useRef<HTMLDivElement | null>(null);

    const callbackRef = (node: HTMLDivElement | null) => {
        messagesEndRef.current = node;
        if (node) {
            node.scrollIntoView({ behavior: 'smooth' });
        }
    };

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

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
                                // Get clean tool name
                                const cleanToolName = message.toolName?.replace(/^[^_]*___/, '') || message.toolName;

                                // Define tools that should show as thinking messages
                                const thinkingTools: Record<string, { thinking: string; completed: string }> = {
                                    'get_block_schema': {
                                        thinking: __('Checking the available block settings...', 'suggerence'),
                                        completed: __('Checked the available block settings', 'suggerence')
                                    },
                                    'get_available_blocks': {
                                        thinking: __('Looking up available blocks...', 'suggerence'),
                                        completed: __('Retrieved available blocks', 'suggerence')
                                    },
                                    // 'search_pattern': {
                                    //     thinking: __('Searching for patterns...', 'suggerence'),
                                    //     completed: __('Found patterns', 'suggerence')
                                    // },
                                    // 'search_media': {
                                    //     thinking: __('Searching media library...', 'suggerence'),
                                    //     completed: __('Searched media library', 'suggerence')
                                    // },
                                    // 'search_openverse': {
                                    //     thinking: __('Searching Openverse...', 'suggerence'),
                                    //     completed: __('Searched Openverse', 'suggerence')
                                    // },
                                    'get_document_structure': {
                                        thinking: __('Analyzing document structure...', 'suggerence'),
                                        completed: __('Analyzed document structure', 'suggerence')
                                    }
                                };

                                // Use ThinkingMessage for certain tools, ToolMessage for others
                                if (cleanToolName != undefined && thinkingTools[cleanToolName]) {
                                    return (
                                        <ThinkingMessage
                                            key={`${message.role}-${index}-${message.date}`}
                                            message={message}
                                            thinkingText={thinkingTools[cleanToolName].thinking}
                                            completedText={thinkingTools[cleanToolName].completed}
                                        />
                                    );
                                }

                                return (
                                    <ToolMessage key={`${message.role}-${index}-${message.date}`} message={message} />
                                );
                            }

                            return (
                                <AssistantMessage key={`${message.role}-${index}-${message.date}`} message={message} />
                            );
                        })}

                        {isLoading && !messages.some(m => m.role === 'tool' && m.loading) && (
                            <div style={{ paddingRight: '2rem', maxWidth: '85%' }}>
                                <HStack justify="start" spacing={2} alignment="center">
                                    <Spinner style={{ color: '#64748b' }} />

                                    <div
                                        style={{
                                            padding: '10px 14px',
                                            backgroundColor: '#f8fafc',
                                            border: '1px solid #e2e8f0',
                                            borderRadius: '12px 12px 12px 4px',
                                            boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
                                        }}
                                    >
                                        <Text
                                            variant="muted"
                                            style={{
                                                fontStyle: 'italic',
                                                color: '#64748b',
                                                fontSize: '14px'
                                            }}
                                        >
                                            {__("Processing your request...", "suggerence")}
                                        </Text>
                                    </div>
                                </HStack>
                            </div>
                        )}

                        <div ref={callbackRef} />
                    </VStack>
                </div>

                <InputArea />
            </VStack>
        </VStack>
    );
};