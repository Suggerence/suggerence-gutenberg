import { PluginSidebar, PluginSidebarMoreMenuItem } from '@wordpress/editor';
import { __ } from '@wordpress/i18n';
import { ChatInterface } from '@/apps/gutenberg-assistant/components/ChatInterface';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { QueryClient } from '@tanstack/react-query';
import { useDispatch } from '@wordpress/data';
import { useEffect } from '@wordpress/element';
import domReady from '@wordpress/dom-ready';
import { WebSocketProvider } from '@/shared/context/WebSocketContext';
import { ThemeProvider } from 'next-themes';

import './style.scss';

/**
 * Query Client
 */

const queryClient = new QueryClient()

const persister = createAsyncStoragePersister({
    storage: window.localStorage,
})


export const GutenbergAssistant = () => {

    const { openGeneralSidebar } = useDispatch('core/edit-post');
    const SIDEBAR_WIDTH_KEY = 'suggerenceSidebarWidth';
    const SIDEBAR_DEFAULT_WIDTH = 500;
    const SIDEBAR_MIN_WIDTH = 320;
    const SIDEBAR_MAX_WIDTH = 900;

    domReady(() => {
        openGeneralSidebar('suggerence-gutenberg-assistant/suggerence-chat-sidebar');
    });

    useEffect(() => {
        if (typeof window === 'undefined') {
            return;
        }

        const SIDEBAR_DOM_ID = 'suggerence-gutenberg-assistant:suggerence-chat-sidebar';

        let cleanup: (() => void) | undefined;
        let observer: MutationObserver | undefined;
        let isEffectActive = true;

        const getStoredWidth = () => {
            const storedWidth = window.localStorage.getItem(SIDEBAR_WIDTH_KEY);
            const parsedWidth = storedWidth ? Number.parseInt(storedWidth, 10) : NaN;
            return Number.isFinite(parsedWidth) ? parsedWidth : SIDEBAR_DEFAULT_WIDTH;
        };

        const applyWidthToDocument = (value: number) => {
            const clampedValue = Math.min(SIDEBAR_MAX_WIDTH, Math.max(SIDEBAR_MIN_WIDTH, value));
            document.documentElement.style.setProperty('--suggerence-sidebar-width', `${clampedValue}px`);
            return clampedValue;
        };

        const setupResize = () => {
            const sidebarElement = document.getElementById(SIDEBAR_DOM_ID) as HTMLElement | null;

            if (!sidebarElement) {
                return false;
            }

            cleanup?.();

            const resizerElement = sidebarElement.querySelector('.suggerence-sidebar-resizer') as HTMLElement | null;
            const sidebarShell = sidebarElement.closest('.interface-interface-skeleton__sidebar') as HTMLElement | null;

            if (!resizerElement || !sidebarShell) {
                return false;
            }

            applyWidthToDocument(getStoredWidth());

            const preventSelection = (selectEvent: Event) => {
                selectEvent.preventDefault();
            };

            const beginResize = (startClientX: number) => {
                const startWidth = sidebarShell.getBoundingClientRect().width;

                const handlePointerMove = (clientX: number) => {
                    const delta = startClientX - clientX;
                    applyWidthToDocument(startWidth + delta);
                };

                const finishResize = () => {
                    document.removeEventListener('selectstart', preventSelection);
                    document.body.classList.remove('is-resizing-suggerence-sidebar');
                    const finalWidth = Math.round(sidebarShell.getBoundingClientRect().width);
                    const clampedFinalWidth = applyWidthToDocument(finalWidth);
                    window.localStorage.setItem(SIDEBAR_WIDTH_KEY, `${clampedFinalWidth}`);
                };

                document.body.classList.add('is-resizing-suggerence-sidebar');
                document.addEventListener('selectstart', preventSelection, { passive: false });

                return { handlePointerMove, finishResize };
            };

            const handlePointerDown = (event: PointerEvent) => {
                event.preventDefault();
                event.stopPropagation();

                const pointerId = event.pointerId;
                const { handlePointerMove, finishResize } = beginResize(event.clientX);

                const handleMove = (moveEvent: PointerEvent) => {
                    handlePointerMove(moveEvent.clientX);
                };

                const handleUpOrCancel = () => {
                    document.removeEventListener('pointermove', handleMove);
                    document.removeEventListener('pointerup', handleUpOrCancel);
                    document.removeEventListener('pointercancel', handleUpOrCancel);
                    if (typeof resizerElement.releasePointerCapture === 'function' && resizerElement.hasPointerCapture?.(pointerId)) {
                        resizerElement.releasePointerCapture(pointerId);
                    }
                    finishResize();
                };

                if (typeof resizerElement.setPointerCapture === 'function') {
                    resizerElement.setPointerCapture(pointerId);
                }

                document.addEventListener('pointermove', handleMove);
                document.addEventListener('pointerup', handleUpOrCancel);
                document.addEventListener('pointercancel', handleUpOrCancel);
            };

            const handleMouseDown = (event: MouseEvent) => {
                if ('PointerEvent' in window) {
                    return;
                }

                if (event.button !== 0) {
                    return;
                }

                event.preventDefault();
                event.stopPropagation();

                const { handlePointerMove, finishResize } = beginResize(event.clientX);

                const handleMouseMove = (moveEvent: MouseEvent) => {
                    handlePointerMove(moveEvent.clientX);
                };

                const handleMouseUp = () => {
                    document.removeEventListener('mousemove', handleMouseMove);
                    document.removeEventListener('mouseup', handleMouseUp);
                    finishResize();
                };

                document.addEventListener('mousemove', handleMouseMove);
                document.addEventListener('mouseup', handleMouseUp);
            };

            const handleTouchStart = (event: TouchEvent) => {
                if ('PointerEvent' in window) {
                    return;
                }

                if (event.touches.length !== 1) {
                    return;
                }

                event.preventDefault();
                event.stopPropagation();

                const initialTouch = event.touches[0];
                const { handlePointerMove, finishResize } = beginResize(initialTouch?.clientX ?? 0);

                const handleTouchMove = (moveEvent: TouchEvent) => {
                    if (moveEvent.touches.length !== 1) {
                        return;
                    }
                    const touch = moveEvent.touches[0];
                    handlePointerMove(touch?.clientX ?? 0);
                };

                const handleTouchEnd = () => {
                    document.removeEventListener('touchmove', handleTouchMove);
                    document.removeEventListener('touchend', handleTouchEnd);
                    document.removeEventListener('touchcancel', handleTouchEnd);
                    finishResize();
                };

                document.addEventListener('touchmove', handleTouchMove, { passive: false });
                document.addEventListener('touchend', handleTouchEnd);
                document.addEventListener('touchcancel', handleTouchEnd);
            };

            resizerElement.addEventListener('pointerdown', handlePointerDown);
            resizerElement.addEventListener('mousedown', handleMouseDown);
            resizerElement.addEventListener('touchstart', handleTouchStart, { passive: false });

            cleanup = () => {
                resizerElement.removeEventListener('pointerdown', handlePointerDown);
                resizerElement.removeEventListener('mousedown', handleMouseDown);
                resizerElement.removeEventListener('touchstart', handleTouchStart);
                document.removeEventListener('selectstart', preventSelection);
                document.body.classList.remove('is-resizing-suggerence-sidebar');
            };

            return true;
        };

        const initialized = setupResize();

        if (!initialized) {
            observer = new MutationObserver(() => {
                if (!isEffectActive) {
                    return;
                }

                if (setupResize()) {
                    observer?.disconnect();
                }
            });

            observer.observe(document.body, {
                childList: true,
                subtree: true,
            });
        }

        return () => {
            isEffectActive = false;
            cleanup?.();
            observer?.disconnect();
        };
    }, []);

    return (
        <>
            <PluginSidebarMoreMenuItem
                target="suggerence-chat-sidebar"
            >
                {__("Suggerence Chat", "suggerence")}
            </PluginSidebarMoreMenuItem>

            <PluginSidebar
                name="suggerence-chat-sidebar"
                title={__("Suggerence Chat", "suggerence")}
            >
                <div
                    className="suggerence-sidebar-resizer"
                    role="separator"
                    aria-orientation="vertical"
                    aria-label={__("Resize Suggerence chat sidebar", "suggerence")}
                />
                <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
                    <PersistQueryClientProvider client={queryClient} persistOptions={{ persister }}>
                        <WebSocketProvider>
                            <ChatInterface />
                        </WebSocketProvider>
                    </PersistQueryClientProvider>
                </ThemeProvider>
            </PluginSidebar>
        </>
    );
};
