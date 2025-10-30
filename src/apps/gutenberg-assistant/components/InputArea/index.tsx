import { __experimentalVStack as VStack, TextareaControl, Button, __experimentalHStack as HStack } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useState, useRef, useEffect, useCallback } from '@wordpress/element';
import { useChatInterfaceStore } from '@/apps/gutenberg-assistant/stores/chatInterfaceStore';
import { useGutenbergAssistantMessagesStore } from '@/apps/gutenberg-assistant/stores/messagesStores';
import { useContextStore } from '@/apps/gutenberg-assistant/stores/contextStore';
import { useToolConfirmationStore } from '@/apps/gutenberg-assistant/stores/toolConfirmationStore';
import { useGutenbergMCP } from '@/apps/gutenberg-assistant/hooks/useGutenbergMcp';
import { useAssistantAI } from '@/apps/gutenberg-assistant/hooks/useAssistantAI';
import { BlockBadge } from '@/apps/gutenberg-assistant/components/BlockBadge';
import { ContextMenuBadge } from '@/apps/gutenberg-assistant/components/ContextMenuBadge';
import { DrawingCanvas } from '@/apps/gutenberg-assistant/components/DrawingCanvas';
import { MediaSelector } from '@/apps/gutenberg-assistant/components/MediaSelector';
import { image, brush } from '@wordpress/icons';
import { AudioButton } from '@/shared/components/AudioButton';
import { X } from 'lucide-react';
import { highlightBlocksFromToolData } from '@/shared/utils/block-highlight';
import { useThinkingContentStore } from '@/components/ai-elements/thinking-content-store';

export const InputArea = () => {

    const { isGutenbergServerReady, getGutenbergTools, callGutenbergTool } = useGutenbergMCP();
    const { callAI, parseAIResponse } = useAssistantAI(callGutenbergTool);
    const [inputValue, setInputValue] = useState('');
    const [isCanvasOpen, setIsCanvasOpen] = useState(false);
    const [isMediaOpen, setIsMediaOpen] = useState(false);
    const { isLoading, setIsLoading, abortController, setAbortController } = useChatInterfaceStore();
    const { messages, addMessage, setLastMessage, setMessages } = useGutenbergAssistantMessagesStore();
    const { addContext } = useContextStore();
    const { pendingToolCall, setPendingToolCall, clearPendingToolCall } = useToolConfirmationStore();

    const inputRef = useRef<HTMLTextAreaElement>(null);
    const isServerReadyRef = useRef(isGutenbergServerReady);

    // Keep ref updated
    useEffect(() => {
        isServerReadyRef.current = isGutenbergServerReady;
    }, [isGutenbergServerReady]);
    
    useEffect(() => {
        if (!isLoading) {
            inputRef.current?.focus();
        }
    }, [isLoading]);

    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    const handleNewMessage = useCallback(async (currentMessages: MCPClientMessage[] = messages, signal?: AbortSignal) => {
        const getMessagesStore = useGutenbergAssistantMessagesStore.getState;
        if (!isServerReadyRef.current) {
            console.error('Server not ready!', { isGutenbergServerReady: isServerReadyRef.current });
            throw new Error('Gutenberg MCP server not ready');
        }

        // Check if aborted before getting tools
        if (signal?.aborted) {
            throw new DOMException('Aborted', 'AbortError');
        }

        const tools = await getGutenbergTools();

        const defaultModel: AIModel = {
            id: 'suggerence-v1',
            provider: 'suggerence',
            providerName: 'Suggerence',
            name: 'Suggerence v1',
            date: new Date().toISOString(),
            capabilities: ['text-generation', 'tool-calling']
        };

        // Create a streaming message that will be updated as chunks arrive
        let streamingMessageId = '';
        let streamingThinkingMessageId = '';
        let thinkingContent = '';
        let thinkingSignature = '';
        let contentAccumulated = '';
        let thinkingStartTime: number | null = null;
        let thinkingDuration = 0;

        // Throttle streaming updates to prevent UI blocking and jumps
        // Use requestAnimationFrame for smooth, non-blocking updates
        let rafId: number | null = null;
        let pendingUpdate: { type: string; content: string } | null = null;

        const flushPendingUpdate = () => {
            if (!pendingUpdate) return;

            const { type, content } = pendingUpdate;
            pendingUpdate = null;

            if (type === 'thinking') {
                thinkingContent = content;

                // Start tracking thinking duration on first chunk
                if (thinkingStartTime === null) {
                    thinkingStartTime = Date.now();
                }

                // Update the store directly instead of updating the message
                useThinkingContentStore.getState().setContent(thinkingContent);

                // Update or create thinking message (only once at the start)
                if (!streamingThinkingMessageId) {
                    streamingThinkingMessageId = 'streaming-thinking-' + Date.now();
                    addMessage({
                        role: 'thinking',
                        content: '',  // Empty content, will be updated via store
                        date: new Date().toISOString(),
                        aiModel: defaultModel.id,
                        loading: true,
                    } as any);
                }
                // Don't call setLastMessage on subsequent chunks - just update the store
            } else if (type === 'waiting') {
                // Orchestrator spawned subagents - close thinking and show waiting message

                // First, close the thinking block if it exists
                if (streamingThinkingMessageId && thinkingStartTime !== null) {
                    thinkingDuration = Math.ceil((Date.now() - thinkingStartTime) / 1000);

                    const updatedThinkingMessage = {
                        role: 'thinking' as const,
                        content: thinkingContent,
                        date: new Date().toISOString(),
                        aiModel: defaultModel.id,
                        loading: false,
                        thinkingSignature: thinkingSignature,
                        thinkingDuration: thinkingDuration
                    };

                    setLastMessage(updatedThinkingMessage as any);
                    streamingThinkingMessageId = null;
                }

                // Then show the waiting message
                if (!streamingMessageId) {
                    streamingMessageId = 'streaming-' + Date.now();
                    addMessage({
                        role: 'assistant',
                        content: content,
                        date: new Date().toISOString(),
                        aiModel: defaultModel.id,
                        loading: true
                    });
                } else {
                    setLastMessage({
                        role: 'assistant',
                        content: contentAccumulated + content,
                        date: new Date().toISOString(),
                        aiModel: defaultModel.id,
                        loading: true
                    } as any);
                }
            } else if (type === 'content') {
                contentAccumulated = content;

                // Update or create content message
                // Mark as loading to indicate streaming is still in progress
                if (!streamingMessageId) {
                    streamingMessageId = 'streaming-' + Date.now();
                    addMessage({
                        role: 'assistant',
                        content: contentAccumulated,
                        date: new Date().toISOString(),
                        aiModel: defaultModel.id,
                        loading: true
                    });
                } else {
                    setLastMessage({
                        role: 'assistant',
                        content: contentAccumulated,
                        date: new Date().toISOString(),
                        aiModel: defaultModel.id,
                        loading: true
                    } as any);
                }
            }

            rafId = null;
        };

        const response = await callAI(
            currentMessages,
            defaultModel,
            tools,
            signal,
            (chunk: { type: string; content: string; accumulated: string; thinkingSignature?: string }) => {
                // For waiting, capture signature and handle immediately (not queued)
                if (chunk.type === 'waiting') {
                    // Capture signature
                    if (chunk.thinkingSignature) {
                        thinkingSignature = chunk.thinkingSignature;
                    }

                    // Flush any pending updates first
                    if (rafId !== null) {
                        cancelAnimationFrame(rafId);
                        rafId = null;
                    }
                    if (pendingUpdate) {
                        flushPendingUpdate();
                    }

                    // Now handle waiting immediately (close thinking, show waiting message)
                    pendingUpdate = {
                        type: chunk.type,
                        content: chunk.content // Use content (the waiting message), not accumulated
                    };
                    flushPendingUpdate();
                    return;
                }

                // Store the pending update
                pendingUpdate = {
                    type: chunk.type,
                    content: chunk.accumulated
                };

                // Schedule update on next animation frame if not already scheduled
                if (rafId === null) {
                    rafId = requestAnimationFrame(flushPendingUpdate);
                }
            }
        );

        // Flush any remaining pending update after streaming completes
        if (rafId !== null) {
            cancelAnimationFrame(rafId);
            rafId = null;
        }
        if (pendingUpdate) {
            flushPendingUpdate();
        }

        const aiResponse = parseAIResponse(response);

        // Check if aborted after AI call
        if (signal?.aborted) {
            throw new DOMException('Aborted', 'AbortError');
        }

        // Capture thinking signature from response
        if ((response as any).thinkingSignature) {
            thinkingSignature = (response as any).thinkingSignature;
        }

        // Calculate thinking duration if we had thinking
        if (thinkingStartTime !== null) {
            thinkingDuration = Math.ceil((Date.now() - thinkingStartTime) / 1000);
        }

        // If we have a streaming thinking message, mark it as complete
        if (streamingThinkingMessageId) {
            // Check if the last message is still the thinking message
            const currentStoreMessages = getMessagesStore().messages;
            const lastMsg = currentStoreMessages[currentStoreMessages.length - 1];

            const updatedThinkingMessage = {
                role: 'thinking' as const,
                content: thinkingContent,
                date: new Date().toISOString(),
                aiModel: defaultModel.id,
                loading: false,
                thinkingDuration: thinkingDuration > 0 ? thinkingDuration : undefined,
                thinkingSignature: thinkingSignature || undefined
            };

            if (lastMsg?.role === 'thinking') {
                // Safe to use setLastMessage
                setLastMessage(updatedThinkingMessage as any);
            } else {
                // Find the thinking message and update it
                const updatedMessages = currentStoreMessages.map((msg) =>
                    msg.role === 'thinking' && msg.loading ? updatedThinkingMessage as any : msg
                );
                setMessages(updatedMessages);
            }

            streamingThinkingMessageId = '';
        }

        if (aiResponse.type === 'tool') {
            // If we have a streaming message with content, mark it as complete before executing tools
            if (streamingMessageId && contentAccumulated) {
                setLastMessage({
                    role: 'assistant',
                    content: contentAccumulated,
                    date: new Date().toISOString(),
                    aiModel: defaultModel.id,
                    loading: false
                } as any);
            }

            // Check if we have multiple function calls to execute
            const allCalls = (response as any).allFunctionCalls;

            if (allCalls && allCalls.length > 1) {
                // Execute all function calls sequentially
                for (const call of allCalls) {
                    // Check tool danger
                    const tool = tools.find((t: { name: string }) => t.name === call.name);
                    const isDangerous = tool?.dangerous === true;

                    if (isDangerous) {
                        // Store the pending tool call and add a confirmation message
                        const pendingTool = {
                            toolCallId: call.id,
                            toolName: call.name,
                            toolArgs: call.args,
                            timestamp: new Date().toISOString()
                        };

                        setPendingToolCall(pendingTool);

                        // Add a tool confirmation message with action buttons
                        addMessage({
                            role: 'tool_confirmation',
                            content: '', // Content will be rendered by the UI component
                            date: new Date().toISOString(),
                            toolCallId: pendingTool.toolCallId,
                            toolName: pendingTool.toolName,
                            toolArgs: pendingTool.toolArgs
                        } as any);

                        highlightBlocksFromToolData(call.args, undefined);

                        // Stop loading state as we're waiting for user action
                        setIsLoading(false);
                        setAbortController(null);
                        return;
                    }

                    // Add tool execution message
                    addMessage({
                        role: 'tool',
                        content: `Calling ${call.name} with args ${JSON.stringify(call.args)}...`,
                        date: new Date().toISOString(),
                        toolCallId: call.id,
                        toolName: call.name,
                        toolArgs: call.args,
                        loading: true
                    });

                    // Check abort
                    if (signal?.aborted) {
                        setLastMessage({
                            role: 'tool',
                            content: 'Stopped by user',
                            date: new Date().toISOString(),
                            toolCallId: call.id,
                            toolName: call.name,
                            toolArgs: call.args,
                            toolResult: 'Stopped by user',
                            loading: false
                        } as any);
                        throw new DOMException('Aborted', 'AbortError');
                    }

                    try {
                        const toolResult = await callGutenbergTool(
                            call.name,
                            call.args,
                            signal
                        );

                        setLastMessage({
                            role: 'tool',
                            content: toolResult.response,
                            date: new Date().toISOString(),
                            toolCallId: call.id,
                            toolName: call.name,
                            toolArgs: call.args,
                            toolResult: toolResult.response,
                            loading: false
                        } as any);
                    } catch (toolError) {
                        if (toolError instanceof DOMException && toolError.name === 'AbortError') {
                            setLastMessage({
                                role: 'tool',
                                content: 'Stopped by user',
                                date: new Date().toISOString(),
                                toolCallId: call.id,
                                toolName: call.name,
                                toolArgs: call.args,
                                toolResult: 'Stopped by user',
                                loading: false
                            } as any);
                            throw toolError;
                        }

                        setLastMessage({
                            role: 'tool',
                            content: `Error: ${toolError instanceof Error ? toolError.message : 'Unknown error'}`,
                            date: new Date().toISOString(),
                            toolCallId: call.id,
                            toolName: call.name,
                            toolArgs: call.args,
                            toolResult: `Error: ${toolError instanceof Error ? toolError.message : 'Unknown error'}`,
                            loading: false
                        } as any);
                    }
                }

                // After all calls executed, continue to next turn
                // The agentic loop will pick this up and continue if needed
                return;
            }

            // Single tool call (legacy path)
            // Check if this is a dangerous tool
            const tool = tools.find(t => t.name === aiResponse.toolName);
            const isDangerous = tool?.dangerous === true;

            if (isDangerous) {
                // Store the pending tool call and add a confirmation message
                const pendingTool = {
                    toolCallId: response.toolCallId || '',
                    toolName: aiResponse.toolName as string,
                    toolArgs: aiResponse.toolArgs as Record<string, any>,
                    timestamp: new Date().toISOString()
                };

                setPendingToolCall(pendingTool);

                // Add a tool confirmation message with action buttons
                addMessage({
                    role: 'tool_confirmation',
                    content: '', // Content will be rendered by the UI component
                    date: new Date().toISOString(),
                    toolCallId: pendingTool.toolCallId,
                    toolName: pendingTool.toolName,
                    toolArgs: pendingTool.toolArgs
                } as any);

                highlightBlocksFromToolData(aiResponse.toolArgs, undefined);

                // Stop loading state as we're waiting for user action
                setIsLoading(false);
                setAbortController(null);
                return;
            }
            // Add the tool execution message
            addMessage({
                role: 'tool',
                content: `Calling ${aiResponse.toolName} with args ${JSON.stringify(aiResponse.toolArgs)}...`,
                date: new Date().toISOString(),
                toolCallId: response.toolCallId,
                toolName: aiResponse.toolName as string,
                toolArgs: aiResponse.toolArgs as Record<string, any>,
                loading: true
            });

            // Check if aborted before executing tool
            if (signal?.aborted) {
                setLastMessage({
                    role: 'tool',
                    content: 'Stopped by user',
                    date: new Date().toISOString(),
                    toolCallId: response.toolCallId,
                    toolName: aiResponse.toolName as string,
                    toolArgs: aiResponse.toolArgs as Record<string, any>,
                    toolResult: 'Stopped by user',
                    loading: false
                } as any);
                throw new DOMException('Aborted', 'AbortError');
            }

            try {
                const toolResult = await callGutenbergTool(
                    aiResponse.toolName as string,
                    aiResponse.toolArgs as Record<string, any>,
                    signal
                );

                setLastMessage({
                    role: 'tool',
                    content: toolResult.response,
                    date: new Date().toISOString(),
                    toolCallId: response.toolCallId,
                    toolName: aiResponse.toolName as string,
                    toolArgs: aiResponse.toolArgs as Record<string, any>,
                    toolResult: toolResult.response,
                    loading: false
                } as any);
            } catch (toolError) {
                // If it's an abort error, mark as stopped and propagate
                if (toolError instanceof DOMException && toolError.name === 'AbortError') {
                    setLastMessage({
                        role: 'tool',
                        content: 'Stopped by user',
                        date: new Date().toISOString(),
                        toolCallId: response.toolCallId,
                        toolName: aiResponse.toolName as string,
                        toolArgs: aiResponse.toolArgs as Record<string, any>,
                        toolResult: 'Stopped by user',
                        loading: false
                    } as any);
                    throw toolError;
                }

                setLastMessage({
                    role: 'tool',
                    content: `Error: ${toolError instanceof Error ? toolError.message : 'Unknown error'}`,
                    date: new Date().toISOString(),
                    toolCallId: response.toolCallId,
                    toolName: aiResponse.toolName as string,
                    toolArgs: aiResponse.toolArgs as Record<string, any>,
                    toolResult: `Error: ${toolError instanceof Error ? toolError.message : 'Unknown error'}`,
                    loading: false
                });
            }
        } else {
            // Text response - mark streaming message as complete
            if (streamingMessageId) {
                // Update the streaming message to mark it as complete (loading: false)
                setLastMessage({
                    role: 'assistant',
                    content: contentAccumulated || (aiResponse.content as string),
                    date: new Date().toISOString(),
                    aiModel: defaultModel.id,
                    loading: false
                } as any);
            } else {
                // Only add a message if no streaming happened (edge case)
                addMessage({
                    role: 'assistant',
                    content: aiResponse.content as string,
                    date: new Date().toISOString(),
                    aiModel: defaultModel.id,
                    loading: false
                });
            }
        }
    }, [getGutenbergTools, callGutenbergTool, callAI, parseAIResponse, addMessage, setLastMessage, setMessages]);

    const handleSendMessage = async () => {
        if (!inputValue.trim() || isLoading) return;

        const userMessage: MCPClientMessage = {
            role: 'user',
            content: inputValue,
            date: new Date().toISOString()
        };

        // If there's a pending tool confirmation, clear it and replace the confirmation message
        if (pendingToolCall) {
            clearPendingToolCall();
            setLastMessage(userMessage);
        } else {
            addMessage(userMessage);
        }
        setInputValue('');

        // Create a new AbortController for this request
        const controller = new AbortController();
        setAbortController(controller);
        setIsLoading(true);

        try {
            await handleNewMessage([...messages, userMessage], controller.signal);
        } catch (error) {
            // Check if the error was due to abortion
            if (error instanceof Error && error.name === 'AbortError') {
                const abortMessage: MCPClientMessage = {
                    role: 'assistant',
                    content: 'Request stopped by user.',
                    date: new Date().toISOString()
                };
                addMessage(abortMessage);
            } else {
                console.error('Send message error:', error);
                const errorMessage: MCPClientMessage = {
                    role: 'assistant',
                    content: `Oops, hit a snag: ${error instanceof Error ? error.message : 'Unknown error'}. Want to give it another shot?`,
                    date: new Date().toISOString()
                };
                addMessage(errorMessage);
            }
            setIsLoading(false);
            setAbortController(null);
        }
    };

    const handleStop = () => {
        if (abortController) {
            abortController.abort();
            setAbortController(null);
            setIsLoading(false);
        }
    };

    const handleAudioMessage = useCallback(async (audioMessage: MCPClientMessage) => {
        if (isLoading) return;

        addMessage(audioMessage);
        setInputValue('');

        // Create a new AbortController for this request
        const controller = new AbortController();
        setAbortController(controller);
        setIsLoading(true);

        try {
            await handleNewMessage([...messages, audioMessage], controller.signal);
        } catch (error) {
            // Check if the error was due to abortion
            if (error instanceof Error && error.name === 'AbortError') {
                const abortMessage: MCPClientMessage = {
                    role: 'assistant',
                    content: 'Request stopped by user.',
                    date: new Date().toISOString()
                };
                addMessage(abortMessage);
            } else {
                console.error('Audio message error:', error);
                const errorMessage: MCPClientMessage = {
                    role: 'assistant',
                    content: `Couldn't process that audio: ${error instanceof Error ? error.message : 'Unknown error'}. Mind trying again?`,
                    date: new Date().toISOString()
                };
                addMessage(errorMessage);
            }
            setIsLoading(false);
            setAbortController(null);
        }
    }, [isLoading, messages, addMessage, setInputValue, setIsLoading, setAbortController, handleNewMessage]);

    const handleKeyPress = (event: React.KeyboardEvent) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            handleSendMessage();
        }
    };

    useEffect(() => {
        const lastMessage = messages[messages.length - 1];

        if (!lastMessage) return;

        // If the last message is an assistant message, only stop loading if it's not loading
        if (lastMessage.role === 'assistant') {
            // If the message is still loading (streaming), don't stop the loading state
            if (!lastMessage.loading) {
                setIsLoading(false);
                setAbortController(null);
            }
            return;
        }

        // If the last message is a completed thinking message, the conversation is done
        if (lastMessage.role === 'thinking' && !lastMessage.loading) {
            setIsLoading(false);
            setAbortController(null);
            return;
        }


        // If tool is still loading, wait
        if (lastMessage.role === 'tool' && lastMessage.loading) return;

        // If tool finished, check if it was stopped by user
        if (lastMessage.role === 'tool' && !lastMessage.loading) {
            // Don't continue if the tool was stopped by user
            if (lastMessage.content === 'Stopped by user' || lastMessage.toolResult === 'Stopped by user') {
                setIsLoading(false);
                setAbortController(null);
                return;
            }

            // Create a new AbortController for continuing the conversation
            const controller = new AbortController();
            setAbortController(controller);
            setIsLoading(true);
            handleNewMessage(messages, controller.signal)
                .catch((error) => {
                    if (error?.name !== 'AbortError') {
                        console.error(error);
                    }
                    setIsLoading(false);
                    setAbortController(null);
                });
        }
    }, [messages]);

    const handleCanvasSave = (imageData: string, description?: string) => {
        const drawingContext = {
            id: `drawing-${Date.now()}`,
            type: 'drawing',
            label: description || 'Hand-drawn diagram',
            data: imageData,
            timestamp: new Date().toISOString()
        };

        addContext(drawingContext);
        setIsCanvasOpen(false);
    };

    const handleGeneratePage = useCallback(async (imageData: string, description?: string) => {
        // First, add the drawing to context
        const drawingContext = {
            id: `drawing-${Date.now()}`,
            type: 'drawing',
            label: description || 'Canvas',
            data: imageData,
            timestamp: new Date().toISOString()
        };

        addContext(drawingContext);
        setIsCanvasOpen(false);

        // Wait for next tick to ensure context store is updated
        // Zustand updates are synchronous, but we need to ensure React has processed the update
        await new Promise(resolve => setTimeout(resolve, 0));

        // Then, send a message to generate the page based on the layout
        const userMessage: MCPClientMessage = {
            role: 'user',
            content: 'Generate the complete page layout from the drawing.',
            date: new Date().toISOString()
        };

        addMessage(userMessage);

        // Create a new AbortController for this request
        const controller = new AbortController();
        setAbortController(controller);
        setIsLoading(true);

        try {
            await handleNewMessage([...messages, userMessage], controller.signal);
        } catch (error) {
            // Check if the error was due to abortion
            if (error instanceof Error && error.name === 'AbortError') {
                const abortMessage: MCPClientMessage = {
                    role: 'assistant',
                    content: 'Request stopped by user.',
                    date: new Date().toISOString()
                };
                addMessage(abortMessage);
            } else {
                console.error('Generate page error:', error);
                const errorMessage: MCPClientMessage = {
                    role: 'assistant',
                    content: `Hit a bump generating that page: ${error instanceof Error ? error.message : 'Unknown error'}. Let's try again?`,
                    date: new Date().toISOString()
                };
                addMessage(errorMessage);
            }
            setIsLoading(false);
            setAbortController(null);
        }
    }, [addContext, setIsCanvasOpen, addMessage, setIsLoading, setAbortController, handleNewMessage, messages]);

    const handleMediaSelect = (imageData: any) => {
        const imageContext = {
            id: `image-${imageData.id}`,
            type: 'image',
            label: `Image ${imageData.id}`,
            data: imageData,
            timestamp: new Date().toISOString()
        };

        addContext(imageContext);
        setIsMediaOpen(false);
    };

    return (
        <VStack spacing={0} style={{ padding: '16px', backgroundColor: '#f9f9f9', borderTop: '1px solid #ddd' }}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap' }}>
                <ContextMenuBadge onContextSelect={addContext} />
                <BlockBadge />

                {/* Context Usage Indicator */}
                {/* {contextUsage && (
                    <div
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            backgroundColor: '#f8fafc',
                            color: getContextUsageColor(contextUsage.percentage),
                            border: '1px solid #e2e8f0',
                            borderRadius: '4px',
                            padding: '2px 6px',
                            fontSize: '11px',
                            fontWeight: 500,
                            fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                            lineHeight: '16px',
                            marginLeft: 'auto' // Push to the right
                        }}
                        title={getContextUsageWarning(contextUsage.percentage) || `Context usage: ${contextUsage.totalTokens} tokens`}
                    >
                        {contextUsage.percentage}%
                    </div>
                )} */}
            </div>


            <TextareaControl
                value={inputValue}
                onChange={setInputValue}
                onKeyDown={handleKeyPress}
                placeholder={messages.length <= 1 ? __("What do you want to create? I'm all ears...", "suggerence") : __("Go ahead, I'm listening...", "suggerence")}
                disabled={isLoading}
                rows={2}
                style={{ resize: 'none' }}
                ref={inputRef}
            />

            <HStack justify="end" spacing={2}>
                <Button
                    onClick={() => setIsMediaOpen(true)}
                    disabled={isLoading}
                    icon={image}
                    size="compact"
                    aria-label={__("Select image", "suggerence")}
                    title={__("Add an image—show me what you're working with", "suggerence")}
                />

                <Button
                    onClick={() => setIsCanvasOpen(true)}
                    disabled={isLoading}
                    icon={brush}
                    size="compact"
                    aria-label={__("Draw diagram", "suggerence")}
                    title={__("Sketch your idea—I'll bring it to life", "suggerence")}
                />

                {/* Audio messages not currently supported by Claude */}
                {/* <AudioButton
                    onAudioMessage={handleAudioMessage}
                    inputValue={inputValue}
                    isLoading={isLoading}
                    disabled={isLoading}
                    size="compact"
                /> */}

{isLoading ? (
                    <Button
                        onClick={handleStop}
                        aria-label={__("Stop", "suggerence")}
                        variant="secondary"
                        size="compact"
                        icon={<X size={16} />}
                        style={{ color: '#d63638' }}
                    >
                        {__("Stop", "suggerence")}
                    </Button>
                ) : (
                    <Button
                        onClick={handleSendMessage}
                        disabled={!inputValue.trim()}
                        aria-label={__("Send", "suggerence")}
                        variant="primary"
                        size="compact"
                    >
                        {__("Send", "suggerence")}
                    </Button>
                )}
            </HStack>

            <DrawingCanvas
                isOpen={isCanvasOpen}
                onClose={() => setIsCanvasOpen(false)}
                onSave={handleCanvasSave}
                onGeneratePage={handleGeneratePage}
            />

            <MediaSelector
                isOpen={isMediaOpen}
                onClose={() => setIsMediaOpen(false)}
                onSelect={handleMediaSelect}
            />
        </VStack>
    );
};