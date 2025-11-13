import { useState, useEffect, useMemo, useRef, useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { select } from '@wordpress/data';
import {
    Modal,
    Button,
    __experimentalVStack as VStack,
    __experimentalHStack as HStack,
    Notice,
    Spinner,
    ToggleControl
} from '@wordpress/components';
import { addQueryArgs } from '@wordpress/url';
import html2canvas from 'html2canvas';
import { Camera, RefreshCw } from 'lucide-react';
import { useScreenshotCaptureStore } from '@/apps/gutenberg-assistant/stores/screenshotCaptureStore';
import type { ScreenshotCaptureResult, ScreenshotViewportPreset } from '@/apps/gutenberg-assistant/components/ScreenshotCapture/types';

const DEVICE_PRESETS: Array<{ id: ScreenshotViewportPreset; label: string; width: number }> = [
    { id: 'desktop', label: __('Desktop (1280px)', 'suggerence-gutenberg'), width: 1280 },
    { id: 'tablet', label: __('Tablet (834px)', 'suggerence-gutenberg'), width: 834 },
    { id: 'mobile', label: __('Mobile (390px)', 'suggerence-gutenberg'), width: 390 }
];

const PREVIEW_CONTAINER_HEIGHT = 700;

interface ScreenshotCaptureProps {
    onCapture: (result: ScreenshotCaptureResult) => void | Promise<void>;
}

const resolvePreviewLink = (): string => {
    const editorStore = select('core/editor') as any;

    const previewLink = editorStore?.getEditedPostPreviewLink?.();
    if (previewLink) return previewLink;

    const getPermalink = editorStore?.getPermalink;
    const permalink = typeof getPermalink === 'function' ? getPermalink() : undefined;
    if (typeof permalink === 'string') {
        return permalink;
    }

    if (permalink?.currentPermalink) {
        return permalink.currentPermalink;
    }

    if (permalink?.generatedPermalink) {
        return permalink.generatedPermalink;
    }

    const currentPost = editorStore?.getCurrentPost?.();
    if (currentPost?.link) {
        return currentPost.link;
    }

    throw new Error(__('Unable to determine a preview URL for this post/page.', 'suggerence-gutenberg'));
};

export const ScreenshotCapture = ({ onCapture }: ScreenshotCaptureProps) => {
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const autoCaptureTriggeredRef = useRef(false);
    const [basePreviewUrl, setBasePreviewUrl] = useState<string | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isPreviewLoading, setIsPreviewLoading] = useState(false);
    const [isCapturing, setIsCapturing] = useState(false);
    const [captureError, setCaptureError] = useState<string | null>(null);
    const [showFlash, setShowFlash] = useState(false);

    const {
        isOpen,
        mode,
        devicePreset,
        setDevicePreset,
        fullHeight,
        setFullHeight,
        requestedUrl,
        pendingRequest,
        close,
        resolveToolCapture,
        rejectToolCapture
    } = useScreenshotCaptureStore();

    const viewportWidth = useMemo(() => {
        return DEVICE_PRESETS.find((preset) => preset.id === devicePreset)?.width || 1280;
    }, [devicePreset]);

    const isSameOrigin = useMemo(() => {
        if (!previewUrl) return true;
        try {
            const resolved = new URL(previewUrl, window.location.href);
            return resolved.origin === window.location.origin;
        } catch {
            return false;
        }
    }, [previewUrl]);

    const buildPreviewUrl = useCallback((url: string, includePreviewParam: boolean) => {
        return addQueryArgs(url, {
            ...(includePreviewParam ? { suggerence_preview: '1' } : {}),
            t: Date.now().toString()
        });
    }, []);

    const loadPreview = useCallback(() => {
        setCaptureError(null);
        setIsPreviewLoading(true);
        autoCaptureTriggeredRef.current = false;

        const useRequestedUrl = requestedUrl && requestedUrl.trim().length > 0;

        try {
            const previewLink = useRequestedUrl ? requestedUrl as string : resolvePreviewLink();
            setBasePreviewUrl(previewLink);
            setPreviewUrl(buildPreviewUrl(previewLink, !useRequestedUrl));
        } catch (error) {
            console.error('Suggerence: Unable to resolve preview URL', error);
            const message = error instanceof Error
                ? error.message
                : __('Unable to resolve preview URL.', 'suggerence-gutenberg');
            setCaptureError(message);
            setIsPreviewLoading(false);
            if (mode === 'tool') {
                rejectToolCapture(message);
            }
        }
    }, [buildPreviewUrl, requestedUrl, mode, rejectToolCapture]);

    useEffect(() => {
        if (isOpen) {
            loadPreview();
        } else {
            setPreviewUrl(null);
            setBasePreviewUrl(null);
            setCaptureError(null);
            setIsPreviewLoading(false);
            setIsCapturing(false);
            setShowFlash(false);
            autoCaptureTriggeredRef.current = false;
        }
    }, [isOpen, loadPreview]);

    const handleReloadPreview = useCallback(() => {
        if (!basePreviewUrl) {
            loadPreview();
            return;
        }
        setIsPreviewLoading(true);
        const includePreviewParam = !(requestedUrl && requestedUrl.trim().length > 0);
        setPreviewUrl(buildPreviewUrl(basePreviewUrl, includePreviewParam));
    }, [basePreviewUrl, buildPreviewUrl, loadPreview, requestedUrl]);

    const waitForFonts = async (targetDocument: Document): Promise<void> => {
        if ('fonts' in targetDocument) {
            try {
                await (targetDocument as any).fonts.ready;
            } catch {
                // ignore font loading failures
            }
        }
    };

    const captureScreenshot = useCallback(async (autoTriggered: boolean = false) => {
        if (!iframeRef.current) {
            const message = __('Preview is not ready yet.', 'suggerence-gutenberg');
            setCaptureError(message);
            if (mode === 'tool') {
                rejectToolCapture(message);
            }
            return;
        }

        if (!isSameOrigin) {
            const message = __('Cannot capture previews that load on a different domain.', 'suggerence-gutenberg');
            setCaptureError(message);
            if (mode === 'tool') {
                rejectToolCapture(message);
            }
            return;
        }

        const iframe = iframeRef.current;
        const iframeDocument = iframe.contentDocument;
        const iframeWindow = iframe.contentWindow;

        if (!iframeDocument) {
            setCaptureError(__('Preview content is not accessible yet.', 'suggerence-gutenberg'));
            if (mode === 'tool') {
                rejectToolCapture(__('Preview content is not accessible yet.', 'suggerence-gutenberg'));
            }
            return;
        }

        setIsCapturing(true);
        setCaptureError(null);
        setShowFlash(true);
        setTimeout(() => setShowFlash(false), 400);

        try {
            await waitForFonts(iframeDocument);

            // Give the preview a short moment to finish layout/animations
            await new Promise((resolve) => setTimeout(resolve, 500));

            const target = iframeDocument.documentElement;
            const body = iframeDocument.body;
            const computedHeight = fullHeight
                ? Math.max(
                    target.scrollHeight,
                    target.offsetHeight,
                    body?.scrollHeight ?? 0,
                    body?.offsetHeight ?? 0
                )
                : PREVIEW_CONTAINER_HEIGHT;

            const backgroundStyles = (iframeWindow || window).getComputedStyle(body || target);
            const backgroundColor = backgroundStyles?.backgroundColor || '#ffffff';

            const canvas = await html2canvas(target, {
                useCORS: true,
                allowTaint: false,
                backgroundColor,
                windowWidth: viewportWidth,
                windowHeight: computedHeight,
                width: viewportWidth,
                height: computedHeight,
                scale: 1
            });

            const dataUrl = canvas.toDataURL('image/png', 0.98);

            if (previewUrl) {
                const result = {
                    dataUrl,
                    previewUrl,
                    width: canvas.width,
                    height: canvas.height,
                    viewportWidth,
                    viewportHeight: PREVIEW_CONTAINER_HEIGHT,
                    capturedAt: new Date().toISOString()
                };

                await Promise.resolve(onCapture(result));

                if (mode === 'tool') {
                    resolveToolCapture(result);
                } else {
                    close();
                }
            }
        } catch (error) {
            console.error('Suggerence: Failed to capture screenshot', error);
            setCaptureError(
                __('Unable to capture the preview. Try reloading the preview and try again.', 'suggerence-gutenberg')
            );
            if (mode === 'tool') {
                rejectToolCapture(__('Unable to capture the preview. Try reloading and try again.', 'suggerence-gutenberg'));
            }
        } finally {
            setIsCapturing(false);
            if (!autoTriggered) {
                autoCaptureTriggeredRef.current = false;
            }
        }
    }, [close, fullHeight, isSameOrigin, mode, onCapture, previewUrl, rejectToolCapture, resolveToolCapture, viewportWidth]);

    useEffect(() => {
        if (
            isOpen &&
            mode === 'tool' &&
            pendingRequest &&
            !isPreviewLoading &&
            !isCapturing &&
            !autoCaptureTriggeredRef.current &&
            previewUrl
        ) {
            autoCaptureTriggeredRef.current = true;
            void captureScreenshot(true);
        }
    }, [isOpen, mode, pendingRequest, isPreviewLoading, isCapturing, previewUrl, captureScreenshot]);

    if (!isOpen) {
        return null;
    }

    return (
        <Modal
            title={__('Capture frontend preview', 'suggerence-gutenberg')}
            onRequestClose={() => {
                if (!isCapturing) {
                    close();
                }
            }}
            isDismissible={!isCapturing}
            shouldCloseOnClickOutside={!isCapturing}
            className="suggerence-screenshot-modal"
        >
            <VStack spacing={3}>
                <p className="text-sm text-muted-foreground">
                    {__("We'll load the frontend preview inside this modal. Once you're happy with the state, click “Capture screenshot” to attach it to the conversation.", 'suggerence-gutenberg')}
                </p>

                {captureError && (
                    <Notice status="error" isDismissible={false}>
                        {captureError}
                    </Notice>
                )}

                {!isSameOrigin && previewUrl && (
                    <Notice status="warning" isDismissible={false}>
                        {__('This site loads previews on a different domain, so browsers block screenshots. Open the editor on the same domain as the frontend to enable capturing.', 'suggerence-gutenberg')}
                    </Notice>
                )}

                {mode === 'tool' && (
                    <Notice status="info" isDismissible={false}>
                        {__('Capturing screenshot for AI request… hang tight for a second.', 'suggerence-gutenberg')}
                    </Notice>
                )}

                <HStack spacing={2} className="w-full justify-between flex-wrap gap-2">
                    <HStack spacing={1} className="flex-wrap gap-1">
                        {DEVICE_PRESETS.map((preset) => (
                            <Button
                                key={preset.id}
                                variant={devicePreset === preset.id ? 'primary' : 'secondary'}
                                onClick={() => setDevicePreset(preset.id)}
                                isSmall
                                disabled={isPreviewLoading || mode === 'tool'}
                            >
                                {preset.label}
                            </Button>
                        ))}
                    </HStack>

                    <ToggleControl
                        label={__('Capture full page height', 'suggerence-gutenberg')}
                        checked={fullHeight}
                        onChange={() => setFullHeight(!fullHeight)}
                        disabled={isCapturing || mode === 'tool'}
                    />
                </HStack>

                <HStack spacing={2} className="w-full justify-between">
                    <Button
                        variant="tertiary"
                        onClick={close}
                        disabled={isCapturing}
                        isSmall
                    >
                        {__('Cancel', 'suggerence-gutenberg')}
                    </Button>
                    <HStack spacing={2}>
                        <Button
                            variant="secondary"
                            onClick={handleReloadPreview}
                            disabled={isPreviewLoading}
                            isSmall
                        >
                            <span className="flex items-center gap-1">
                                <RefreshCw className="h-4 w-4" />
                                {__('Reload preview', 'suggerence-gutenberg')}
                            </span>
                        </Button>
                        <Button
                            variant="primary"
                            onClick={() => captureScreenshot()}
                            disabled={isPreviewLoading || isCapturing || !previewUrl}
                            isSmall
                        >
                            <span className="flex items-center gap-1">
                                <Camera className="h-4 w-4" />
                                {isCapturing
                                    ? __('Capturing…', 'suggerence-gutenberg')
                                    : __('Capture screenshot', 'suggerence-gutenberg')}
                            </span>
                        </Button>
                    </HStack>
                </HStack>

                <div className="relative mt-2 border border-border rounded-md overflow-hidden">
                    {showFlash && (
                        <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/80 dark:bg-white/20 backdrop-blur-sm pointer-events-none transition-opacity duration-500">
                            <Camera className="h-12 w-12 text-muted-foreground opacity-80" />
                        </div>
                    )}
                    {(!previewUrl || isPreviewLoading) && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-background/80 z-10">
                            <Spinner />
                            <span className="text-sm text-muted-foreground">
                                {__('Loading preview…', 'suggerence-gutenberg')}
                            </span>
                        </div>
                    )}

                    {previewUrl && (
                        <div className="overflow-auto bg-muted">
                            <iframe
                                ref={iframeRef}
                                key={`${previewUrl}-${devicePreset}`}
                                src={previewUrl}
                                style={{
                                    width: `${viewportWidth}px`,
                                    height: `${PREVIEW_CONTAINER_HEIGHT}px`,
                                    border: '0',
                                    background: '#ffffff'
                                }}
                                width={viewportWidth}
                                height={PREVIEW_CONTAINER_HEIGHT}
                                onLoad={() => setIsPreviewLoading(false)}
                                loading="lazy"
                            />
                        </div>
                    )}
                </div>
            </VStack>
        </Modal>
    );
};
