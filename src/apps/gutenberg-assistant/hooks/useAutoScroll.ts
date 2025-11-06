import { useRef, useEffect, useCallback } from '@wordpress/element';

const SCROLL_BOTTOM_THRESHOLD = 4;
const PROGRAMMATIC_SCROLL_RESET_DELAY = 400;

export const useAutoScroll = (messages: MCPClientMessage[]) => {
    const scrollContainerRef = useRef<HTMLDivElement | null>(null);
    const autoScrollEnabledRef = useRef(true);
    const programmaticScrollRef = useRef(false);
    const programmaticTimeoutRef = useRef<number | null>(null);
    const lastMessageCountRef = useRef(messages.length);
    const lastContentLengthRef = useRef(0);

    const isNearBottom = useCallback((container: HTMLDivElement) => {
        const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
        return distanceFromBottom <= SCROLL_BOTTOM_THRESHOLD;
    }, []);

    const clearProgrammaticTimeout = useCallback(() => {
        if (programmaticTimeoutRef.current) {
            window.clearTimeout(programmaticTimeoutRef.current);
            programmaticTimeoutRef.current = null;
        }
    }, []);

    const markProgrammaticScroll = useCallback(() => {
        programmaticScrollRef.current = true;
        clearProgrammaticTimeout();

        programmaticTimeoutRef.current = window.setTimeout(() => {
            programmaticScrollRef.current = false;
            programmaticTimeoutRef.current = null;
        }, PROGRAMMATIC_SCROLL_RESET_DELAY);
    }, [clearProgrammaticTimeout]);

    // Smooth scroll to bottom if auto-scroll is enabled
    const scrollToBottom = useCallback(() => {
        if (!autoScrollEnabledRef.current || !scrollContainerRef.current) {
            return;
        }

        const container = scrollContainerRef.current;
        if (isNearBottom(container)) {
            return;
        }

        markProgrammaticScroll();

        container.scrollTo({
            top: container.scrollHeight - container.clientHeight,
            behavior: 'smooth'
        });
    }, [isNearBottom, markProgrammaticScroll]);

    // Detect manual scrolling
    const handleScroll = useCallback(() => {
        const container = scrollContainerRef.current;
        if (!container) return;

        if (isNearBottom(container)) {
            autoScrollEnabledRef.current = true;
            return;
        }

        if (!programmaticScrollRef.current) {
            autoScrollEnabledRef.current = false;
        }
    }, [isNearBottom]);

    // Callback ref for messages end marker
    const messagesEndCallbackRef = useCallback((node: HTMLDivElement | null) => {
        if (node && autoScrollEnabledRef.current) {
            scrollToBottom();
        }
    }, [scrollToBottom]);

    // Track new messages and content updates (for streaming)
    useEffect(() => {
        const container = scrollContainerRef.current;
        if (container && isNearBottom(container)) {
            autoScrollEnabledRef.current = true;
        }

        const hasNewMessage = messages.length > lastMessageCountRef.current;
        lastMessageCountRef.current = messages.length;

        const currentContentLength = messages.reduce((sum, msg) =>
            sum + (msg.content?.length || 0), 0
        );
        const contentChanged = currentContentLength !== lastContentLengthRef.current;
        lastContentLengthRef.current = currentContentLength;

        if (autoScrollEnabledRef.current && (hasNewMessage || contentChanged)) {
            scrollToBottom();
        }
    }, [isNearBottom, messages, scrollToBottom]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            clearProgrammaticTimeout();
        };
    }, [clearProgrammaticTimeout]);

    return {
        scrollContainerRef,
        messagesEndCallbackRef,
        handleScroll
    };
};
