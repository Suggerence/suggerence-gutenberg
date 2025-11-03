import { __ } from '@wordpress/i18n';
import { useCallback, useState } from '@wordpress/element';
import { useGutenbergAssistantMessagesStore } from '@/apps/gutenberg-assistant/stores/messagesStores';
import { useToolConfirmationStore } from '@/apps/gutenberg-assistant/stores/toolConfirmationStore';
import { useContextStore } from '@/apps/gutenberg-assistant/stores/contextStore';
import { useGutenbergMCP } from '@/apps/gutenberg-assistant/hooks/useGutenbergMcp';
import { useAssistantAI } from '@/apps/gutenberg-assistant/hooks/useAssistantAI';
import { highlightBlocksFromToolData, removeBlockHighlightsFromToolData } from '@/shared/utils/block-highlight';
import type { SelectedContext } from '@/apps/gutenberg-assistant/stores/types';

interface UseAssistantComposerReturn {
    inputValue: string;
    setInputValue: (value: string) => void;
    isLoading: boolean;
    isServerReady: boolean;
    hasHistory: boolean;
    sendMessage: (overrideContent?: string) => Promise<void>;
    stop: () => void;
    isCanvasOpen: boolean;
    openCanvas: () => void;
    closeCanvas: () => void;
    handleCanvasSave: (imageData: string, description?: string) => void;
    handleGeneratePage: (imageData: string, description?: string) => Promise<void>;
    isMediaOpen: boolean;
    openMedia: () => void;
    closeMedia: () => void;
    handleMediaSelect: (imageData: any) => void;
    handleAudioMessage: (audioMessage: MCPClientMessage) => Promise<void>;
    addContext: (context: SelectedContext) => void;
    acceptToolCall: (toolCallId: string) => Promise<void>;
    rejectToolCall: (toolCallId: string) => Promise<void>;
    acceptAllToolCalls: () => Promise<void>;
}

export const useAssistantComposer = (): UseAssistantComposerReturn => {
    const {
        messages,
        addMessage,
        isLoading,
        setIsLoading,
        abortController,
        setAbortController,
        upsertThinkingMessage,
        completeThinkingMessage,
        upsertContentMessage,
        upsertToolMessage,
        completeToolMessage,
        resetTracker,
        setMessages
    } = useGutenbergAssistantMessagesStore();

    const enqueueToolCall = useToolConfirmationStore((state) => state.enqueueToolCall);
    const removeToolCall = useToolConfirmationStore((state) => state.removeToolCall);
    const getToolCall = useToolConfirmationStore((state) => state.getToolCall);
    const hasPendingToolCalls = useToolConfirmationStore((state) => state.hasPending);

    const { addContext } = useContextStore();
    const { isGutenbergServerReady, getGutenbergTools, callGutenbergTool } = useGutenbergMCP();
    const { callAI } = useAssistantAI();

    const [inputValue, setInputValue] = useState('');
    const hasHistory = messages.length > 1;
    const [isCanvasOpen, setCanvasOpen] = useState(false);
    const [isMediaOpen, setMediaOpen] = useState(false);

    const runConversation = useCallback(async (conversation: MCPClientMessage[], existingController?: AbortController) => {
        if (!isGutenbergServerReady) {
            throw new Error('Gutenberg MCP server not ready');
        }

        const controller = existingController ?? new AbortController();
        const isRootCall = !existingController;

        if (isRootCall) {
            setAbortController(controller);
            setIsLoading(true);
        }

        const defaultModel: AIModel = {
            id: 'suggerence-v1',
            provider: 'suggerence',
            providerName: 'Suggerence',
            name: 'Suggerence v1',
            date: new Date().toISOString(),
            capabilities: ['text-generation', 'tool-calling']
        };

        resetTracker();

        let thinkingStartTime: number | null = null;
        let hasThinkingMessage = false;

        const ensureThinkingMessage = () => {
            if (!hasThinkingMessage) {
                hasThinkingMessage = true;
                thinkingStartTime = Date.now();
                upsertThinkingMessage('', defaultModel.id);
            }
        };

        const finishThinkingMessage = (signature?: string) => {
            if (!hasThinkingMessage) return;
            const duration = thinkingStartTime !== null
                ? Math.ceil((Date.now() - thinkingStartTime) / 1000)
                : undefined;
            completeThinkingMessage(duration, signature);
            hasThinkingMessage = false;
            thinkingStartTime = null;
        };

        try {
            const tools = await getGutenbergTools();
            let response: any;

            try {
                response = await callAI(
                    conversation,
                    defaultModel,
                    tools,
                    controller.signal,
                    (chunk) => {
                        if (chunk.type === 'thinking') {
                            ensureThinkingMessage();
                            upsertThinkingMessage(chunk.accumulated, defaultModel.id);
                        }

                        if (chunk.type === 'content') {
                            finishThinkingMessage();
                            upsertContentMessage(chunk.accumulated, defaultModel.id);
                        }
                    },
                    undefined,
                    (signature) => {
                        ensureThinkingMessage();
                        finishThinkingMessage(signature);
                    }
                );
            } finally {
                finishThinkingMessage();
            }

            const functionCalls: Array<{ id: string; name: string; args: any }> = response?.allFunctionCalls ?? [];
            let processedFunctionCall = false;
            const parallelToolRuns: Promise<void>[] = [];

            for (const functionCall of functionCalls) {
                processedFunctionCall = true;
                ensureThinkingMessage();
                finishThinkingMessage();

                const toolArgs = functionCall.args ?? {};
                const tool = tools.find((t: any) => t.name === functionCall.name);

                if (tool?.dangerous) {
                    enqueueToolCall({
                        toolCallId: functionCall.id,
                        toolName: functionCall.name,
                        toolArgs,
                        timestamp: new Date().toISOString()
                    });
                    addMessage({
                        role: 'tool_confirmation',
                        content: '',
                        date: new Date().toISOString(),
                        toolCallId: functionCall.id,
                        toolName: functionCall.name,
                        toolArgs
                    } as any);
                    highlightBlocksFromToolData(toolArgs, undefined);
                    continue;
                }

                upsertToolMessage(functionCall.id, functionCall.name, toolArgs, `Calling ${functionCall.name}...`);

                const toolPromise = (async () => {
                    try {
                        const toolResult = await callGutenbergTool(functionCall.name, toolArgs, controller.signal);
                        completeToolMessage(functionCall.id, toolResult.response);
                    } catch (toolError) {
                        const errorMsg = toolError instanceof DOMException && toolError.name === 'AbortError'
                            ? 'Stopped by user'
                            : `Error: ${toolError instanceof Error ? toolError.message : 'Unknown error'}`;
                        completeToolMessage(functionCall.id, errorMsg);
                        if (toolError instanceof DOMException && toolError.name === 'AbortError') {
                            throw toolError;
                        }
                    }
                })();

                parallelToolRuns.push(toolPromise);
            }

            if (parallelToolRuns.length > 0) {
                try {
                    await Promise.all(parallelToolRuns);
                } catch (toolError) {
                    if (toolError instanceof DOMException && toolError.name === 'AbortError') {
                        throw toolError;
                    }
                    console.error('Tool execution error:', toolError);
                }
            }

            if (!response || controller.signal.aborted) {
                return;
            }

            const latestMessages = useGutenbergAssistantMessagesStore.getState().messages;
            const lastMessage = latestMessages[latestMessages.length - 1];
            const toolWasStopped = lastMessage?.role === 'tool' && (
                lastMessage.content === 'Stopped by user' ||
                lastMessage.toolResult === 'Stopped by user'
            );
            const hasPendingConfirmation = useToolConfirmationStore.getState().hasPending();
            const shouldContinue = processedFunctionCall &&
                !toolWasStopped &&
                !hasPendingConfirmation;

            if (shouldContinue) {
                await runConversation(latestMessages, controller);
            }
        } finally {
            if (!existingController) {
                setIsLoading(false);
                setAbortController(null);
            }
        }
    }, [
        isGutenbergServerReady,
        setAbortController,
        setIsLoading,
        resetTracker,
        upsertThinkingMessage,
        completeThinkingMessage,
        upsertContentMessage,
        upsertToolMessage,
        completeToolMessage,
        getGutenbergTools,
        callAI,
        callGutenbergTool,
        enqueueToolCall,
        addMessage
    ]);

    const startTurn = useCallback(async (conversation: MCPClientMessage[]) => {
        try {
            await runConversation(conversation);
        } catch (error) {
            if (error instanceof DOMException && error.name === 'AbortError') {
                addMessage({
                    role: 'assistant',
                    content: 'Request stopped by user.',
                    date: new Date().toISOString()
                });
                return;
            }

            console.error('Assistant error:', error);
            addMessage({
                role: 'assistant',
                content: `Oops, hit a snag: ${error instanceof Error ? error.message : 'Unknown error'}. Want to give it another shot?`,
                date: new Date().toISOString()
            });
        }
    }, [addMessage, runConversation]);

    const sendMessage = useCallback(async (overrideContent?: string) => {
        const content = (overrideContent ?? inputValue).trim();
        if (!content || isLoading || !isGutenbergServerReady) return;

        const userMessage: MCPClientMessage = {
            role: 'user',
            content,
            date: new Date().toISOString()
        };

        addMessage(userMessage);
        setInputValue('');

        if (!hasPendingToolCalls()) {
            const latestConversation = useGutenbergAssistantMessagesStore.getState().messages;
            await startTurn(latestConversation);
        }
    }, [
        inputValue,
        isLoading,
        isGutenbergServerReady,
        addMessage,
        startTurn,
        hasPendingToolCalls
    ]);

    const stop = useCallback(() => {
        if (abortController) {
            abortController.abort();
        }
        setAbortController(null);
        setIsLoading(false);
    }, [abortController, setAbortController, setIsLoading]);

    const handleCanvasSave = useCallback((imageData: string, description?: string) => {
        addContext({
            id: `drawing-${Date.now()}`,
            type: 'drawing',
            label: description || 'Hand-drawn diagram',
            data: imageData,
            timestamp: new Date().toISOString()
        });
        setCanvasOpen(false);
    }, [addContext]);

    const handleGeneratePage = useCallback(async (imageData: string, description?: string) => {
        addContext({
            id: `drawing-${Date.now()}`,
            type: 'drawing',
            label: description || 'Canvas',
            data: imageData,
            timestamp: new Date().toISOString()
        });
        setCanvasOpen(false);

        await new Promise((resolve) => setTimeout(resolve, 0));
        await sendMessage('Generate the complete page layout from the drawing.');
    }, [addContext, sendMessage]);

    const handleMediaSelect = useCallback((imageData: any) => {
        addContext({
            id: `image-${imageData.id}`,
            type: 'image',
            label: `Image ${imageData.id}`,
            data: imageData,
            timestamp: new Date().toISOString()
        });
        setMediaOpen(false);
    }, [addContext]);

    const handleAudioMessage = useCallback(async (audioMessage: MCPClientMessage) => {
        if (isLoading || !isGutenbergServerReady) return;

        addMessage(audioMessage);
        setInputValue('');

        if (!hasPendingToolCalls()) {
            const latestConversation = useGutenbergAssistantMessagesStore.getState().messages;
            await startTurn(latestConversation);
        }
    }, [
        isLoading,
        isGutenbergServerReady,
        addMessage,
        startTurn,
        hasPendingToolCalls
    ]);

    const acceptToolCall = useCallback(async (toolCallId: string) => {
        const toolCall = getToolCall(toolCallId);
        if (!toolCall) return;

        removeToolCall(toolCallId);
        removeBlockHighlightsFromToolData(toolCall.toolArgs, undefined);

        const currentMessages = useGutenbergAssistantMessagesStore.getState().messages;
        const filteredMessages = currentMessages.filter(
            (msg) => !(msg.role === 'tool_confirmation' && msg.toolCallId === toolCallId)
        );
        setMessages(filteredMessages);

        upsertToolMessage(toolCall.toolCallId, toolCall.toolName, toolCall.toolArgs, `Calling ${toolCall.toolName}...`);

        const controller = new AbortController();
        setAbortController(controller);
        setIsLoading(true);

        try {
            const result = await callGutenbergTool(toolCall.toolName, toolCall.toolArgs, controller.signal);
            completeToolMessage(toolCall.toolCallId, result.response);
        } catch (error) {
            const errorMsg = error instanceof DOMException && error.name === 'AbortError'
                ? 'Stopped by user'
                : `Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
            completeToolMessage(toolCall.toolCallId, errorMsg);
            if (!(error instanceof DOMException && error.name === 'AbortError')) {
                console.error('Tool execution error:', error);
            }
        } finally {
            setIsLoading(false);
            setAbortController(null);
        }

        if (!hasPendingToolCalls()) {
            const latestConversation = useGutenbergAssistantMessagesStore.getState().messages;
            await startTurn(latestConversation);
        }
    }, [
        getToolCall,
        removeToolCall,
        setMessages,
        upsertToolMessage,
        callGutenbergTool,
        completeToolMessage,
        setAbortController,
        setIsLoading,
        hasPendingToolCalls,
        startTurn
    ]);

    const rejectToolCall = useCallback(async (toolCallId: string) => {
        const toolCall = getToolCall(toolCallId);
        if (!toolCall) return;

        removeToolCall(toolCallId);
        removeBlockHighlightsFromToolData(toolCall.toolArgs, undefined);

        const currentMessages = useGutenbergAssistantMessagesStore.getState().messages;
        const filteredMessages = currentMessages.filter(
            (msg) => !(msg.role === 'tool_confirmation' && msg.toolCallId === toolCallId)
        );
        setMessages(filteredMessages);

        addMessage({
            role: 'assistant',
            content: __('Tool execution cancelled.', 'suggerence'),
            date: new Date().toISOString()
        });
    }, [getToolCall, removeToolCall, setMessages, addMessage]);

    const acceptAllToolCalls = useCallback(async () => {
        const pending = [...useToolConfirmationStore.getState().pendingToolCalls];
        for (const call of pending) {
            await acceptToolCall(call.toolCallId);
        }
    }, [acceptToolCall]);

    return {
        inputValue,
        setInputValue,
        isLoading,
        isServerReady: isGutenbergServerReady,
        hasHistory,
        sendMessage,
        stop,
        isCanvasOpen,
        openCanvas: () => setCanvasOpen(true),
        closeCanvas: () => setCanvasOpen(false),
        handleCanvasSave,
        handleGeneratePage,
        isMediaOpen,
        openMedia: () => setMediaOpen(true),
        closeMedia: () => setMediaOpen(false),
        handleMediaSelect,
        handleAudioMessage,
        addContext,
        acceptToolCall,
        rejectToolCall,
        acceptAllToolCalls
    };
};
