import { useState, useEffect, useMemo, useRef, useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { select } from '@wordpress/data';
import { Modal } from '@wordpress/components';
import { addQueryArgs } from '@wordpress/url';
import html2canvas from 'html2canvas';
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

    const {
        isOpen,
        mode,
        devicePreset,
        fullHeight,
        requestedUrl,
        pendingRequest,
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
            setIsPreviewLoading(false);
            setIsCapturing(false);
            autoCaptureTriggeredRef.current = false;
        }
    }, [isOpen, loadPreview]);

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
            if (mode === 'tool') {
                rejectToolCapture(message);
            }
            return;
        }

        if (!isSameOrigin) {
            const message = __('Cannot capture previews that load on a different domain.', 'suggerence-gutenberg');
            if (mode === 'tool') {
                rejectToolCapture(message);
            }
            return;
        }

        const iframe = iframeRef.current;
        const iframeDocument = iframe.contentDocument;
        const iframeWindow = iframe.contentWindow;

        if (!iframeDocument) {
            const message = __('Preview content is not accessible yet.', 'suggerence-gutenberg');
            if (mode === 'tool') {
                rejectToolCapture(message);
            }
            return;
        }

        setIsCapturing(true);

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
                }
            }
        } catch (error) {
            console.error('Suggerence: Failed to capture screenshot', error);
            const message = __('Unable to capture the preview. Try reloading the preview and try again.', 'suggerence-gutenberg');
            if (mode === 'tool') {
                rejectToolCapture(message);
            }
        } finally {
            setIsCapturing(false);
            if (!autoTriggered) {
                autoCaptureTriggeredRef.current = false;
            }
        }
    }, [fullHeight, isSameOrigin, mode, onCapture, previewUrl, rejectToolCapture, resolveToolCapture, viewportWidth]);

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
            onRequestClose={() => undefined}
            isDismissible={false}
            shouldCloseOnClickOutside={false}
            shouldCloseOnEsc={false}
            className="suggerence-screenshot-modal suggerence-app"
            __experimentalHideHeader
        >
            {previewUrl && (
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
            )}
        </Modal>
    );
};
