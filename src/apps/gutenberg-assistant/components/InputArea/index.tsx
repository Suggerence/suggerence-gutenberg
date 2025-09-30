import { __experimentalVStack as VStack, TextareaControl, Button, __experimentalHStack as HStack, Notice } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useState, useRef, useEffect, useCallback } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { useChatInterfaceStore } from '@/apps/gutenberg-assistant/stores/chatInterfaceStore';
import { useGutenbergAssistantMessagesStore } from '@/apps/gutenberg-assistant/stores/messagesStores';
import { useContextStore } from '@/apps/gutenberg-assistant/stores/contextStore';
import { useGutenbergMCP } from '@/apps/gutenberg-assistant/hooks/useGutenbergMcp';
import { useAssistantAI } from '@/apps/gutenberg-assistant/hooks/useAssistantAI';
import { BlockBadge } from '@/apps/gutenberg-assistant/components/BlockBadge';
import { ContextMenuBadge } from '@/apps/gutenberg-assistant/components/ContextMenuBadge';
import { DrawingCanvas } from '@/apps/gutenberg-assistant/components/DrawingCanvas';
import { MediaSelector } from '@/apps/gutenberg-assistant/components/MediaSelector';
import { getContextUsageColor, getContextUsageWarning } from '@/shared/utils/contextCalculator';
import { image, brush } from '@wordpress/icons';
import { AudioButton } from '@/shared/components/AudioButton';

export const InputArea = () => {

    const { isGutenbergServerReady, getGutenbergTools, callGutenbergTool } = useGutenbergMCP();
    const { callAI, parseAIResponse } = useAssistantAI();
    const [inputValue, setInputValue] = useState('');
    const [isCanvasOpen, setIsCanvasOpen] = useState(false);
    const [isMediaOpen, setIsMediaOpen] = useState(false);
    const { isLoading, setIsLoading } = useChatInterfaceStore();
    const { messages, addMessage, setLastMessage } = useGutenbergAssistantMessagesStore();
    const { addContext, contextUsage, updateContextUsage, selectedContexts } = useContextStore();

    const inputRef = useRef<HTMLTextAreaElement>(null);

    // Get current Gutenberg state using useSelect to listen for changes
    const gutenbergState = useSelect((select: any) => {
        const {
            getBlocks,
            getEditedPostAttribute,
        } = select('core/block-editor');

        const {
            getEditedPostAttribute: getEditorPostAttribute,
        } = select('core/editor');

        const blocks = getBlocks();
        const postTitle = getEditorPostAttribute?.('title') || getEditedPostAttribute?.('title') || '';

        return {
            blocks,
            postTitle,
            lastUpdated: Date.now() // Force updates when blocks change
        };
    }, []);

    useEffect(() => {
        inputRef.current?.focus();
    }, [isLoading]);

    // Comprehensive context calculation function
    const calculateContextUsage = useCallback(() => {
        try {
            // Build comprehensive gutenberg context
            const gutenbergContext = {
                post: {
                    title: gutenbergState.postTitle,
                    totalBlocks: gutenbergState.blocks.length
                },
                blocks: gutenbergState.blocks.map((block: any, index: number) => ({
                    position: index,
                    id: block.clientId,
                    name: block.name,
                    content: block.attributes?.content || '',
                    attributes: block.attributes
                })),
                lastUpdated: new Date().toISOString()
            };

            // Build system prompt with current context
            const systemPrompt = `You are a Gutenberg Block Editor AI Assistant. Your job is to execute user requests immediately using the available tools.

## CRITICAL BEHAVIOR RULES:
1. **ONE TOOL PER RESPONSE**: Execute exactly ONE tool per response, never claim to do multiple actions at once
2. **ACT IMMEDIATELY**: Execute tools right away without asking for confirmation or permission
3. **NO PLANNING RESPONSES**: Don't explain what you're going to do - just do it

## Block Context Awareness:
- Use the specific block IDs provided below for precise targeting
- Consider block positions and content when making decisions
- Understand parent-child relationships in nested blocks

## Current Editor State:
${JSON.stringify(gutenbergContext, null, 2)}

## Additional Context Selected by User:
${selectedContexts.map(ctx => {
                if (ctx.type === 'drawing') {
                    return `${ctx.type}: ${ctx.label} - The user has provided a hand-drawn diagram or sketch (base64 image data available)`;
                }
                return `${ctx.type}: ${ctx.label}`;
            }).join(', ') || 'None'}

Remember: Use the specific block IDs from the context above for precise block targeting.`;

            // Include current input as if it were part of messages
            const messagesWithCurrentInput = [...messages];
            if (inputValue.trim()) {
                messagesWithCurrentInput.push({
                    role: 'user',
                    content: inputValue,
                    date: new Date().toISOString()
                });
            }

            console.log('Calculating context usage with:', {
                messagesCount: messagesWithCurrentInput.length,
                selectedContextsCount: selectedContexts.length,
                blocksCount: gutenbergState.blocks.length,
                inputLength: inputValue.length,
                systemPromptLength: systemPrompt.length
            });

            updateContextUsage({
                messages: messagesWithCurrentInput,
                systemPrompt,
                gutenbergContext
            });
        } catch (error) {
            console.warn('Could not calculate context usage:', error);
        }
    }, [gutenbergState, selectedContexts, messages, inputValue, updateContextUsage]);

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
            id: 'suggerence-v1',
            provider: 'suggerence',
            providerName: 'Suggerence',
            name: 'Suggerence v1',
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

    // Update context usage when anything changes
    useEffect(() => {
        calculateContextUsage();
    }, [calculateContextUsage]);

    // Debounced input change handler for real-time updates
    useEffect(() => {
        const debounceTimer = setTimeout(() => {
            calculateContextUsage();
        }, 300); // 300ms debounce for input changes

        return () => clearTimeout(debounceTimer);
    }, [inputValue, calculateContextUsage]);

    const handleContextSelect = (context: any) => {
        console.log('Context selected:', context);
        addContext(context);
    };

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

    const handleMediaSelect = (imageData: any, description?: string) => {
        const imageContext = {
            id: `image-${imageData.id}`,
            type: 'image',
            label: description || `Image ${imageData.id}`,
            data: imageData,
            timestamp: new Date().toISOString()
        };

        addContext(imageContext);
        setIsMediaOpen(false);
    };

    const handleAudioMessage = useCallback(async (audioMessage: MCPClientMessage) => {
        addMessage(audioMessage);
        setInputValue('');
        setIsLoading(true);

        try {
            await handleNewMessage([...messages, audioMessage]);
        } catch (error) {
            const errorMessage: MCPClientMessage = {
                role: 'assistant',
                content: `Sorry, I encountered an error processing your audio: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`,
                date: new Date().toISOString()
            };

            addMessage(errorMessage);
        } finally {
            setIsLoading(false);
        }
    }, [messages, addMessage, setIsLoading, handleNewMessage]);

    return (
        <VStack spacing={0} style={{ padding: '16px', backgroundColor: '#f9f9f9', borderTop: '1px solid #ddd' }}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap' }}>
                <ContextMenuBadge onContextSelect={handleContextSelect} />
                <BlockBadge />

                {/* Context Usage Indicator */}
                {contextUsage && (
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
                )}
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
                    size="compact"
                />

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

            <DrawingCanvas
                isOpen={isCanvasOpen}
                onClose={() => setIsCanvasOpen(false)}
                onSave={handleCanvasSave}
            />

            <MediaSelector
                isOpen={isMediaOpen}
                onClose={() => setIsMediaOpen(false)}
                onSelect={handleMediaSelect}
            />
        </VStack>
    );
};