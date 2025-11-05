import { useGutenbergMCP } from '@/apps/gutenberg-assistant/hooks/useGutenbergMcp';
import { __ } from '@wordpress/i18n';
import { PanelHeader } from '@/apps/gutenberg-assistant/components/PanelHeader';
import { Conversation } from '@/apps/gutenberg-assistant/components/Conversation';
import { useGutenbergAssistantMessagesStore } from '@/apps/gutenberg-assistant/stores/messagesStores';
import { InputArea } from '@/apps/gutenberg-assistant/components/InputArea';
import { useAssistantComposer } from '@/apps/gutenberg-assistant/hooks/useAssistantComposer';
import { BrainIcon } from 'lucide-react';
import { ThinkingWords } from '@/components/ai-elements/thinking-words';
import { useAutoScroll } from '@/apps/gutenberg-assistant/hooks/useAutoScroll';

export const ChatInterface = () => {
    const { isGutenbergServerReady } = useGutenbergMCP();
    const composer = useAssistantComposer();
    const { messages, isLoading } = useGutenbergAssistantMessagesStore();

    const { scrollContainerRef, messagesEndCallbackRef, handleScroll } = useAutoScroll(messages, isLoading);

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
                    className="flex-1 overflow-y-auto p-2 sugg-scrollbar"
                >
                    <Conversation
                        messages={messages}
                        onAcceptTool={composer.acceptToolCall}
                        onRejectTool={composer.rejectToolCall}
                        onAlwaysAllowTool={composer.alwaysAllowToolCall}
                        onAcceptAllTools={composer.acceptAllToolCalls}
                    />

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

                    <div ref={messagesEndCallbackRef} />
                </div>

                <InputArea
                    inputValue={composer.inputValue}
                    setInputValue={composer.setInputValue}
                    isLoading={composer.isLoading}
                    isServerReady={composer.isServerReady}
                    hasHistory={composer.hasHistory}
                    sendMessage={composer.sendMessage}
                    stop={composer.stop}
                    isCanvasOpen={composer.isCanvasOpen}
                    openCanvas={composer.openCanvas}
                    closeCanvas={composer.closeCanvas}
                    handleCanvasSave={composer.handleCanvasSave}
                    handleGeneratePage={composer.handleGeneratePage}
                    isMediaOpen={composer.isMediaOpen}
                    openMedia={composer.openMedia}
                    closeMedia={composer.closeMedia}
                    handleMediaSelect={composer.handleMediaSelect}
                    addContext={composer.addContext}
                />
            </div>
        </div>
    );
};
