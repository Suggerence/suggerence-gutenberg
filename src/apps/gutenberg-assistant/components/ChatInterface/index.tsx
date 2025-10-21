import { useRef, useEffect, useCallback } from '@wordpress/element';
import {
    PanelBody,
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
import { ActionMessage } from '@/apps/gutenberg-assistant/components/ActionMessage';
import { AssistantMessage } from '@/apps/gutenberg-assistant/components/AssistantMessage';
import { ThinkingMessage } from '@/apps/gutenberg-assistant/components/ThinkingMessage';
import { ToolConfirmationMessage } from '@/apps/gutenberg-assistant/components/ToolConfirmationMessage';
import { AssistantMessageGroup } from '@/apps/gutenberg-assistant/components/AssistantMessageGroup';
import { useGutenbergAssistantMessagesStore } from '@/apps/gutenberg-assistant/stores/messagesStores';
import { useChatInterfaceStore } from '@/apps/gutenberg-assistant/stores/chatInterfaceStore';
import { useToolConfirmationStore } from '@/apps/gutenberg-assistant/stores/toolConfirmationStore';
import { InputArea } from '@/apps/gutenberg-assistant/components/InputArea';
import { Loader2 } from 'lucide-react';
import { Response } from '@/components/ai-elements/response';
import { removeBlockHighlightsFromToolData } from '@/shared/utils/block-highlight';

export const ChatInterface = () => {
    const { isGutenbergServerReady, callGutenbergTool } = useGutenbergMCP();
    const { messages, setLastMessage } = useGutenbergAssistantMessagesStore();
    const { isLoading, setIsLoading, setAbortController } = useChatInterfaceStore();
    const { pendingToolCall, clearPendingToolCall } = useToolConfirmationStore();

    const messagesEndRef = useRef<HTMLDivElement | null>(null);

    // Group consecutive assistant messages together
    const groupMessages = (messages: MCPClientMessage[]) => {
        const groups: Array<{ type: 'user' | 'assistant-group', messages: MCPClientMessage[] }> = [];
        let currentGroup: MCPClientMessage[] = [];
        let currentType: 'user' | 'assistant-group' | null = null;

        messages.forEach((message) => {
            const messageType = message.role === 'user' ? 'user' : 'assistant-group';

            if (messageType === currentType) {
                currentGroup.push(message);
            } else {
                if (currentGroup.length > 0) {
                    groups.push({ type: currentType!, messages: currentGroup });
                }
                currentGroup = [message];
                currentType = messageType;
            }
        });

        if (currentGroup.length > 0) {
            groups.push({ type: currentType!, messages: currentGroup });
        }

        return groups;
    };

    const handleToolConfirmAccept = useCallback(async () => {
        if (!pendingToolCall) return;

        const toolCall = { ...pendingToolCall };
        clearPendingToolCall();

        // Replace confirmation message with tool execution message
        setLastMessage({
            role: 'tool',
            content: `Calling ${toolCall.toolName} with args ${JSON.stringify(toolCall.toolArgs)}...`,
            date: new Date().toISOString(),
            toolCallId: toolCall.toolCallId,
            toolName: toolCall.toolName,
            toolArgs: toolCall.toolArgs,
            loading: true
        });

        // Execute the tool (follow the same flow as non-dangerous tools)
        const controller = new AbortController();
        setAbortController(controller);
        setIsLoading(true);

        try {
            // Remove highlights from blocks that were affected by this tool operation
            removeBlockHighlightsFromToolData(toolCall.toolArgs, undefined);

            const toolResult = await callGutenbergTool(
                toolCall.toolName,
                toolCall.toolArgs,
                controller.signal
            );

            setLastMessage({
                role: 'tool',
                content: toolResult.response,
                date: new Date().toISOString(),
                toolCallId: toolCall.toolCallId,
                toolName: toolCall.toolName,
                toolArgs: toolCall.toolArgs,
                toolResult: toolResult.response,
                loading: false
            } as any);
        } catch (toolError) {
            if (toolError instanceof DOMException && toolError.name === 'AbortError') {
                setLastMessage({
                    role: 'tool',
                    content: 'Stopped by user',
                    date: new Date().toISOString(),
                    toolCallId: toolCall.toolCallId,
                    toolName: toolCall.toolName,
                    toolArgs: toolCall.toolArgs,
                    toolResult: 'Stopped by user',
                    loading: false
                } as any);
            } else {
                setLastMessage({
                    role: 'tool',
                    content: `Error: ${toolError instanceof Error ? toolError.message : 'Unknown error'}`,
                    date: new Date().toISOString(),
                    toolCallId: toolCall.toolCallId,
                    toolName: toolCall.toolName,
                    toolArgs: toolCall.toolArgs,
                    toolResult: `Error: ${toolError instanceof Error ? toolError.message : 'Unknown error'}`,
                    loading: false
                });
            }
            setIsLoading(false);
            setAbortController(null);
        }
    }, [pendingToolCall, clearPendingToolCall, setLastMessage, callGutenbergTool, setAbortController, setIsLoading]);

    const handleToolConfirmReject = useCallback(() => {
        if (pendingToolCall) {
            const toolCall = { ...pendingToolCall };
            // Remove highlights from blocks that were affected by this tool operation
            removeBlockHighlightsFromToolData(toolCall.toolArgs, undefined);
            clearPendingToolCall();
        };

        // Replace confirmation message with cancellation message
        setLastMessage({
            role: 'assistant',
            content: 'Tool execution cancelled.',
            date: new Date().toISOString()
        });
    }, [pendingToolCall, clearPendingToolCall, setLastMessage]);

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
                        {groupMessages(messages).map((group, groupIndex) => {
                            if (group.type === 'user') {
                                return group.messages.map((message, index) => (
                                    <UserMessage
                                        key={`${message.role}-${groupIndex}-${index}-${message.date}`}
                                        message={message}
                                    />
                                ));
                            }

                            // Assistant group - wrap in AssistantMessageGroup with vertical line
                            return (
                                <AssistantMessageGroup key={`assistant-group-${groupIndex}`}>
                                    {group.messages.map((message, index) => {
                                        if (message.role === 'tool_confirmation') {
                                            return (
                                                <ToolConfirmationMessage
                                                    key={`${message.role}-${groupIndex}-${index}-${message.date}`}
                                                    message={message}
                                                    onAccept={handleToolConfirmAccept}
                                                    onReject={handleToolConfirmReject}
                                                />
                                            );
                                        }

                                        if (message.role === 'thinking') {
                                            return (
                                                <ThinkingMessage
                                                    key={`${message.role}-${groupIndex}-${index}-${message.date}`}
                                                    message={message}
                                                />
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
                                                'get_document_structure': {
                                                    thinking: __('Analyzing document structure...', 'suggerence'),
                                                    completed: __('Analyzed document structure', 'suggerence')
                                                }
                                            };

                                            // Use ActionMessage for certain tools, ToolMessage for others
                                            if (cleanToolName != undefined && thinkingTools[cleanToolName]) {
                                                return (
                                                    <ActionMessage
                                                        key={`${message.role}-${groupIndex}-${index}-${message.date}`}
                                                        message={message}
                                                        thinkingText={thinkingTools[cleanToolName].thinking}
                                                        completedText={thinkingTools[cleanToolName].completed}
                                                    />
                                                );
                                            }

                                            return (
                                                <ToolMessage
                                                    key={`${message.role}-${groupIndex}-${index}-${message.date}`}
                                                    message={message}
                                                />
                                            );
                                        }

                                        return (
                                            <AssistantMessage
                                                key={`${message.role}-${groupIndex}-${index}-${message.date}`}
                                                message={message}
                                            />
                                        );
                                    })}
                                </AssistantMessageGroup>
                            );
                        })}

                        {isLoading && !messages.some(m => m.role === 'tool' && m.loading) && (
                            <>
                                <HStack justify="start" alignment="center">
                                    {isLoading && (
                                        <Loader2
                                            size={16}
                                            style={{
                                                animation: 'spin 1s linear infinite',
                                                color: '#64748b',
                                                flexShrink: 0
                                            }}
                                        />
                                    )}
                                  
                                    <Response
                                        parseIncompleteMarkdown={true}
                                        className="text-sm leading-relaxed text-gray-600 thinking-message"
                                    >
                                        {__("Thinking...", "suggerence")}
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
                            </>
                        )}


                        <div ref={callbackRef} />
                    </VStack>
                </div>

                <InputArea />
            </VStack>
        </VStack>
    );
};