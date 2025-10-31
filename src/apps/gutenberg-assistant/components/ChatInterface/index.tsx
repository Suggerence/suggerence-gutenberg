import { useRef, useEffect, useCallback } from '@wordpress/element';
import { useGutenbergMCP } from '@/apps/gutenberg-assistant/hooks/useGutenbergMcp';
import { __ } from '@wordpress/i18n';
import { PanelHeader } from '@/apps/gutenberg-assistant/components/PanelHeader';
import { UserMessage } from '@/apps/gutenberg-assistant/components/UserMessage';
import { ToolMessage } from '@/apps/gutenberg-assistant/components/ToolMessage';
import { ActionMessage } from '@/apps/gutenberg-assistant/components/ActionMessage';
import { AssistantMessage } from '@/apps/gutenberg-assistant/components/AssistantMessage';
import { ThinkingMessage } from '@/apps/gutenberg-assistant/components/ThinkingMessage';
import { ThinkToolMessage } from '@/apps/gutenberg-assistant/components/ThinkToolMessage';
import { ToolConfirmationMessage } from '@/apps/gutenberg-assistant/components/ToolConfirmationMessage';
import { AssistantMessageGroup } from '@/apps/gutenberg-assistant/components/AssistantMessageGroup';
import { useGutenbergAssistantMessagesStore } from '@/apps/gutenberg-assistant/stores/messagesStores';
import { useChatInterfaceStore } from '@/apps/gutenberg-assistant/stores/chatInterfaceStore';
import { useToolConfirmationStore } from '@/apps/gutenberg-assistant/stores/toolConfirmationStore';
import { InputArea } from '@/apps/gutenberg-assistant/components/InputArea';
import { BrainIcon } from 'lucide-react';
import { ThinkingWords } from '@/components/ai-elements/thinking-words';
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

    const scrollContainerRef = useRef<HTMLDivElement | null>(null);
    const lastMessageCountRef = useRef(messages.length);
    const isUserScrollingRef = useRef(false);
    const scrollTimeoutRef = useRef<number | null>(null);
    const lastContentLengthRef = useRef(0);
    const autoScrollRAFRef = useRef<number | null>(null);
    const lastAutoScrollTimeRef = useRef(0);

    // Detect when user is manually scrolling
    const handleScroll = useCallback(() => {
        if (!scrollContainerRef.current) return;

        const now = Date.now();
        // Ignore scroll events that happen too soon after auto-scroll
        if (now - lastAutoScrollTimeRef.current < 300) return;

        const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
        const distanceFromBottom = scrollHeight - scrollTop - clientHeight;

        // If user scrolled up more than 50px from bottom, they're manually scrolling
        isUserScrollingRef.current = distanceFromBottom > 50;

        // Clear any existing timeout
        if (scrollTimeoutRef.current) {
            clearTimeout(scrollTimeoutRef.current);
        }

        // Reset after 1.5 seconds of no scrolling if near bottom
        scrollTimeoutRef.current = window.setTimeout(() => {
            if (scrollContainerRef.current) {
                const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
                const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
                if (distanceFromBottom < 50) {
                    isUserScrollingRef.current = false;
                }
            }
        }, 1500);
    }, []);

    // Smooth auto-scroll function that respects user scroll position
    const performAutoScroll = useCallback(() => {
        if (autoScrollRAFRef.current) {
            cancelAnimationFrame(autoScrollRAFRef.current);
        }

        autoScrollRAFRef.current = requestAnimationFrame(() => {
            if (isUserScrollingRef.current) return;

            if (scrollContainerRef.current) {
                const container = scrollContainerRef.current;
                const targetScroll = container.scrollHeight - container.clientHeight;
                const currentScroll = container.scrollTop;

                // If already at bottom, no need to scroll
                if (Math.abs(targetScroll - currentScroll) < 10) return;

                // Record auto-scroll time to ignore immediate scroll events
                lastAutoScrollTimeRef.current = Date.now();

                // Use smooth scrolling
                container.scrollTo({
                    top: targetScroll,
                    behavior: 'smooth'
                });
            }
        });
    }, []);

    const callbackRef = useCallback((node: HTMLDivElement | null) => {
        messagesEndRef.current = node;

        // Only auto-scroll if user isn't manually scrolling
        if (node && !isUserScrollingRef.current) {
            performAutoScroll();
        }
    }, [performAutoScroll]);

    // Track both new messages AND content updates (for streaming)
    useEffect(() => {
        const hasNewMessage = messages.length > lastMessageCountRef.current;
        lastMessageCountRef.current = messages.length;

        // Calculate total content length to detect streaming updates
        const currentContentLength = messages.reduce((sum, msg) =>
            sum + (msg.content?.length || 0), 0
        );
        const contentChanged = currentContentLength !== lastContentLengthRef.current;
        const hadContent = lastContentLengthRef.current > 0;
        lastContentLengthRef.current = currentContentLength;

        // Auto-scroll on new messages or content updates (streaming)
        // Skip first render (hadContent will be false)
        if (hadContent && (hasNewMessage || contentChanged)) {
            performAutoScroll();
        }
    }, [messages, performAutoScroll]);

    // Auto-scroll while loading/streaming
    useEffect(() => {
        if (!isLoading) return;

        // Scroll every 100ms while loading to handle streaming content
        const interval = setInterval(() => {
            if (!isUserScrollingRef.current && scrollContainerRef.current) {
                const container = scrollContainerRef.current;
                const targetScroll = container.scrollHeight - container.clientHeight;
                const currentScroll = container.scrollTop;

                // Only scroll if not already at bottom
                if (Math.abs(targetScroll - currentScroll) >= 10) {
                    lastAutoScrollTimeRef.current = Date.now();
                    container.scrollTo({
                        top: targetScroll,
                        behavior: 'smooth'
                    });
                }
            }
        }, 100);

        return () => clearInterval(interval);
    }, [isLoading]);

    // Cleanup RAF on unmount
    useEffect(() => {
        return () => {
            if (autoScrollRAFRef.current) {
                cancelAnimationFrame(autoScrollRAFRef.current);
            }
            if (scrollTimeoutRef.current) {
                clearTimeout(scrollTimeoutRef.current);
            }
        };
    }, []);

    if (!isGutenbergServerReady) {
        return (
            <div className="p-4 bg-background">
                <div className="rounded-lg border border-yellow-500/50 bg-yellow-50 dark:bg-yellow-950/20 p-4">
                    <p className="text-sm text-yellow-900 dark:text-yellow-100">
                        {__("Connecting to Gutenberg AI. Please wait...", "suggerence")}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-background">
            <PanelHeader />

            <div className="flex-1 overflow-hidden flex flex-col">
                <div
                    ref={scrollContainerRef}
                    onScroll={handleScroll}
                    className="flex-1 overflow-y-auto p-2"
                >
                    <div className="space-y-0">
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

                                            // Special handling for think tool - show as reasoning component
                                            if (cleanToolName === 'think') {
                                                return (
                                                    <ThinkToolMessage
                                                        key={`${message.role}-${groupIndex}-${index}-${message.date}`}
                                                        message={message}
                                                    />
                                                );
                                            }

                                            // Define tools that should be completely hidden from the user
                                            const hiddenTools = ['get_block_schema'];

                                            // Don't render hidden tools
                                            if (cleanToolName && hiddenTools.includes(cleanToolName)) {
                                                return null;
                                            }

                                            // Define tools that should show as thinking messages
                                            const thinkingTools: Record<string, { thinking: string; completed: string }> = {
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

                        {isLoading && !messages.some(m => m.role === 'tool' && m.loading) && !messages.some(m => m.role === 'thinking' && m.loading) && !messages.some(m => m.role === 'assistant' && m.loading) && (
                            <>
                                <div className="flex w-full items-center gap-2 text-muted-foreground text-sm transition-colors hover:text-foreground pb-4">
                                    <BrainIcon className="size-4" />
                                    <ThinkingWords duration={1} changeInterval={3000} />
                                </div>
                
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
                    </div>
                </div>

                <InputArea />
            </div>
        </div>
    );
};