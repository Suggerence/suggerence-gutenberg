import { __experimentalVStack as VStack, TextareaControl, Button, __experimentalHStack as HStack } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useState, useRef, useEffect } from '@wordpress/element';
import { useChatInterfaceStore } from '@/apps/gutenberg-assistant/stores/chatInterfaceStore';
import { useGutenbergAssistantMessagesStore } from '@/apps/gutenberg-assistant/stores/messagesStores';
import { useGutenbergMCP } from '@/apps/gutenberg-assistant/hooks/useGutenbergMcp';
import { useAI } from '@/apps/gutenberg-assistant/hooks/use-ai';
import { BlockBadge } from '@/apps/gutenberg-assistant/components/BlockBadge';
import { ContextMenuBadge } from '@/apps/gutenberg-assistant/components/ContextMenuBadge';

export const InputArea = () => {

    const { isGutenbergServerReady, getGutenbergTools, callGutenbergTool } = useGutenbergMCP();
    const { callAI, parseAIResponse } = useAI();
    const [inputValue, setInputValue] = useState('');
    const { isLoading, setIsLoading } = useChatInterfaceStore();
    const { messages, addMessage, setLastMessage } = useGutenbergAssistantMessagesStore();

    const inputRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        inputRef.current?.focus();
    }, [isLoading]);

    const handleSendMessage = async () => {
        if (!inputValue.trim() || isLoading) return;

        const userMessage: MCPClientMessage = {
            role: 'user',
            content: inputValue,
            date: new Date().toISOString()
        };

        addMessage(userMessage);
        setInputValue('');
        setIsLoading(true);

        try {
            await handleNewMessage([...messages, userMessage]);
        } catch (error) {
            const errorMessage: MCPClientMessage = {
                role: 'assistant',
                content: `Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`,
                date: new Date().toISOString()
            };

            addMessage(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const handleNewMessage = async (currentMessages: MCPClientMessage[] = messages) => {
        if (!isGutenbergServerReady) {
            throw new Error('Gutenberg MCP server not ready');
        }

        const tools = await getGutenbergTools();

        const defaultModel: AIModel = {
            id: 'gemini-2.0-flash',
            provider: 'gemini',
            providerName: 'Gemini',
            name: 'Gemini 2.0 Flash',
            date: new Date().toISOString(),
            capabilities: ['text-generation', 'tool-calling']
        };

        const response = await callAI(currentMessages, defaultModel, tools);
        const aiResponse = parseAIResponse(response);

        if (aiResponse.type === 'tool') {
            addMessage({
                role: 'tool',
                content: `Calling ${aiResponse.toolName} with args ${JSON.stringify(aiResponse.toolArgs)}...`,
                date: new Date().toISOString(),
                toolName: aiResponse.toolName as string,
                toolArgs: aiResponse.toolArgs as Record<string, any>,
                loading: true
            });

            try {
                const toolResult = await callGutenbergTool(aiResponse.toolName as string, aiResponse.toolArgs as Record<string, any>);

                setLastMessage({
                    role: 'tool',
                    content: `Tool ${aiResponse.toolName} called with arguments ${JSON.stringify(aiResponse.toolArgs)} and returned ${toolResult.response}. Please, format the response to the user.`,
                    date: new Date().toISOString(),
                    toolName: aiResponse.toolName as string,
                    toolArgs: aiResponse.toolArgs as Record<string, any>,
                    toolResult: toolResult.response,
                    loading: false
                });
            } catch (toolError) {
                setLastMessage({
                    role: 'tool',
                    content: `Tool ${aiResponse.toolName} failed: ${toolError instanceof Error ? toolError.message : 'Unknown error'}`,
                    date: new Date().toISOString(),
                    toolName: aiResponse.toolName as string,
                    toolArgs: aiResponse.toolArgs as Record<string, any>,
                    toolResult: 'error',
                    loading: false
                });
            }
        } else {
            addMessage({
                role: 'assistant',
                content: aiResponse.content as string,
                date: new Date().toISOString(),
                aiModel: defaultModel.id
            });
        }
    };

    const handleKeyPress = (event: React.KeyboardEvent) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            handleSendMessage();
        }
    };

    useEffect(() => {
        const lastMessage = messages[messages.length - 1];

        if (!lastMessage) return;
        if (lastMessage.role === 'assistant') return;
        if (lastMessage.role === 'tool' && lastMessage.loading) return;

        if (lastMessage.role === 'tool' && !lastMessage.loading) {
            handleNewMessage().catch(console.error);
        }
    }, [messages]);

    const handleContextSelect = (context: any) => {
        console.log('Context selected:', context);
        // TODO: Implement context handling logic
        // Context structure: { id, type, label, data? }
    };

    return (
        <VStack spacing={0} style={{ padding: '16px', backgroundColor: '#f9f9f9', borderTop: '1px solid #ddd' }}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap' }}>
                <ContextMenuBadge onContextSelect={handleContextSelect} />
                <BlockBadge />
            </div>
            <TextareaControl
                value={inputValue}
                onChange={setInputValue}
                onKeyDown={handleKeyPress}
                placeholder={messages.length <= 1 ? __("Ask me to create content, move blocks, or modify your post...", "suggerence") : __("Reply...", "suggerence")}
                disabled={isLoading}
                rows={2}
                style={{ resize: 'none' }}
                ref={inputRef}
            />

            <HStack justify="end">
                <Button
                    onClick={handleSendMessage}
                    disabled={!inputValue.trim() || isLoading}
                    isBusy={isLoading}
                    aria-label={__("Send", "suggerence")}
                    variant="primary"
                    size="compact"
                >
                    {isLoading ? (
                        __("Sending", "suggerence")
                    ) : (
                        __("Send", "suggerence")
                    )}
                </Button>
            </HStack>
        </VStack>
    );
};