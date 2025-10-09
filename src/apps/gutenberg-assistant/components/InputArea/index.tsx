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

export const InputArea = () => {

    const { isGutenbergServerReady, getGutenbergTools, callGutenbergTool } = useGutenbergMCP();
    const { callAI, parseAIResponse } = useAssistantAI();
    const [inputValue, setInputValue] = useState('');
    const [isCanvasOpen, setIsCanvasOpen] = useState(false);
    const [isMediaOpen, setIsMediaOpen] = useState(false);
    const { isLoading, setIsLoading, abortController, setAbortController } = useChatInterfaceStore();
    const { messages, addMessage, setLastMessage } = useGutenbergAssistantMessagesStore();
    const { addContext } = useContextStore();
    const { pendingToolCall, setPendingToolCall, clearPendingToolCall } = useToolConfirmationStore();
    const [availableTools, setAvailableTools] = useState<SuggerenceMCPResponseTool[]>([]);

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
        if (!isServerReadyRef.current) {
            console.error('Server not ready!', { isGutenbergServerReady: isServerReadyRef.current });
            throw new Error('Gutenberg MCP server not ready');
        }

        // Check if aborted before getting tools
        if (signal?.aborted) {
            throw new DOMException('Aborted', 'AbortError');
        }

        const tools = await getGutenbergTools();
        setAvailableTools(tools);

        const defaultModel: AIModel = {
            id: 'suggerence-v1',
            provider: 'suggerence',
            providerName: 'Suggerence',
            name: 'Suggerence v1',
            date: new Date().toISOString(),
            capabilities: ['text-generation', 'tool-calling']
        };

        const response = await callAI(currentMessages, defaultModel, tools);
        const aiResponse = parseAIResponse(response);

        // Check if aborted after AI call
        if (signal?.aborted) {
            throw new DOMException('Aborted', 'AbortError');
        }

        if (aiResponse.type === 'tool') {
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
            addMessage({
                role: 'assistant',
                content: aiResponse.content as string,
                date: new Date().toISOString(),
                aiModel: defaultModel.id
            });
        }
    }, [getGutenbergTools, callGutenbergTool, callAI, parseAIResponse, addMessage, setLastMessage]);

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
                    content: `Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`,
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
        console.log('handleAudioMessage called', { isLoading, isGutenbergServerReady, audioMessage });
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
                    content: `Sorry, I encountered an error processing your audio: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`,
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

        // If the last message is an assistant message, the conversation is done
        if (lastMessage.role === 'assistant') {
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

        // Then, send a message to generate the page based on the layout
        const userMessage: MCPClientMessage = {
            role: 'user',
            content: 'Generate the complete page layout from the drawing.',
            date: new Date().toISOString()
        };

        addMessage(userMessage);
        setIsLoading(true);

        try {
            await handleNewMessage([...messages, userMessage]);
        } catch (error) {
            console.error('Generate page error:', error);
            const errorMessage: MCPClientMessage = {
                role: 'assistant',
                content: `Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`,
                date: new Date().toISOString()
            };

            addMessage(errorMessage);
            setIsLoading(false);
        }
    }, [addContext, setIsCanvasOpen, addMessage, setIsLoading, handleNewMessage, messages]);

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
                placeholder={messages.length <= 1 ? __("Ask me to create content, move blocks, or modify your post...", "suggerence") : __("Reply...", "suggerence")}
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
                    title={__("Select an image to add as context", "suggerence")}
                />

                <Button
                    onClick={() => setIsCanvasOpen(true)}
                    disabled={isLoading}
                    icon={brush}
                    size="compact"
                    aria-label={__("Draw diagram", "suggerence")}
                    title={__("Draw a diagram or sketch to add as context", "suggerence")}
                />

                <AudioButton
                    onAudioMessage={handleAudioMessage}
                    inputValue={inputValue}
                    isLoading={isLoading}
                    disabled={isLoading}
                    size="compact"
                />

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