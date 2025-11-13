import { __ } from '@wordpress/i18n';
import { useEffect, useRef, useCallback } from '@wordpress/element';
import type { KeyboardEvent } from 'react';
import { BlockBadge } from '@/apps/gutenberg-assistant/components/BlockBadge';
import { ContextMenuBadge } from '@/apps/gutenberg-assistant/components/ContextMenuBadge';
import { DrawingCanvas } from '@/apps/gutenberg-assistant/components/DrawingCanvas';
import { ScreenshotCapture } from '@/apps/gutenberg-assistant/components/ScreenshotCapture';
import type { ScreenshotCaptureResult } from '@/apps/gutenberg-assistant/components/ScreenshotCapture/types';
import { MediaSelector } from '@/apps/gutenberg-assistant/components/MediaSelector';
import type { SelectedContext } from '@/apps/gutenberg-assistant/stores/types';
import {
    PromptInput,
    PromptInputTextarea,
    PromptInputToolbar,
    PromptInputTools,
    PromptInputButton,
    PromptInputSubmit
} from '@/components/ai-elements/prompt-input';
import { Brush, Camera, ImageIcon, Send, SquareIcon } from 'lucide-react';
import { useScreenshotCaptureStore } from '@/apps/gutenberg-assistant/stores/screenshotCaptureStore';

interface InputAreaProps {
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
    addContext: (context: SelectedContext) => void;
    handleScreenshotCapture: (result: ScreenshotCaptureResult) => void;
}

export const InputArea = ({
    inputValue,
    setInputValue,
    isLoading,
    isServerReady,
    hasHistory,
    sendMessage,
    stop,
    isCanvasOpen,
    openCanvas,
    closeCanvas,
    handleCanvasSave,
    handleGeneratePage,
    isMediaOpen,
    openMedia,
    closeMedia,
    handleMediaSelect,
    addContext,
    handleScreenshotCapture
}: InputAreaProps) => {

    const inputRef = useRef<HTMLTextAreaElement>(null);
    const openScreenshotModal = useScreenshotCaptureStore((state) => state.openManual);

    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    useEffect(() => {
        if (!isLoading) {
            inputRef.current?.focus();
        }
    }, [isLoading]);

    const handleKeyDown = useCallback((event: KeyboardEvent<HTMLTextAreaElement>) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            void sendMessage();
        }
    }, [sendMessage]);

    const canSend = isServerReady && inputValue.trim().length > 0 && !isLoading;
    const placeholder = hasHistory
        ? __("Go ahead, I'm listening...", "suggerence")
        : __("What do you want to create? I'm all ears...", "suggerence");

    return (
        <div className="p-3 border-t border-border bg-card/50">
            <div className="flex gap-2 items-center mb-2 flex-wrap">
                <ContextMenuBadge onContextSelect={addContext} />
                <BlockBadge />
            </div>

            <PromptInput
                onSubmit={(message, event) => {
                    event.preventDefault();
                    if (message.text && !isLoading && isServerReady) {
                        void sendMessage(message.text);
                    }
                }}
                className="w-full"
            >
                <PromptInputTextarea
                    ref={inputRef}
                    value={inputValue}
                    onChange={(event) => setInputValue(event.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    disabled={isLoading || !isServerReady}
                    className="min-h-[100px] resize-none text-foreground placeholder:text-muted-foreground"
                />

                <PromptInputToolbar className="bg-transparent border-t-0">
                    <PromptInputTools>
                        <PromptInputButton
                            onClick={openMedia}
                            disabled={isLoading}
                            aria-label={__("Select image", "suggerence")}
                            title={__("Add an image—show me what you're working with", "suggerence")}
                            className="text-muted-foreground hover:text-foreground"
                        >
                            <ImageIcon className="w-4 h-4" />
                        </PromptInputButton>

                        <PromptInputButton
                            onClick={openCanvas}
                            disabled={isLoading}
                            aria-label={__("Draw diagram", "suggerence")}
                            title={__("Sketch your idea—I'll bring it to life", "suggerence")}
                            className="text-muted-foreground hover:text-foreground"
                        >
                            <Brush className="w-4 h-4" />
                        </PromptInputButton>
                        <PromptInputButton
                            onClick={openScreenshotModal}
                            disabled={isLoading}
                            aria-label={__("Capture preview screenshot", "suggerence")}
                            title={__("Grab a screenshot of the frontend preview and attach it as context", "suggerence")}
                            className="text-muted-foreground hover:text-foreground"
                        >
                            <Camera className="w-4 h-4" />
                        </PromptInputButton>
                    </PromptInputTools>

                    {isLoading ? (
                        <PromptInputButton
                            onClick={stop}
                            aria-label={__("Stop", "suggerence")}
                            variant="destructive"
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            <SquareIcon className="w-4 h-4" />
                        </PromptInputButton>
                    ) : (
                        <PromptInputSubmit
                            disabled={!canSend}
                            aria-label={__("Send", "suggerence")}
                            className="bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                        >
                            <Send className="w-4 h-4" />
                        </PromptInputSubmit>
                    )}
                </PromptInputToolbar>
            </PromptInput>

            <DrawingCanvas
                isOpen={isCanvasOpen}
                onClose={closeCanvas}
                onSave={handleCanvasSave}
                onGeneratePage={handleGeneratePage}
            />

            <MediaSelector
                isOpen={isMediaOpen}
                onClose={closeMedia}
                onSelect={handleMediaSelect}
            />

            <ScreenshotCapture onCapture={handleScreenshotCapture} />
        </div>
    );
};
