import { useRef, useEffect, useCallback } from '@wordpress/element';

export const useAutoScroll = (messages: MCPClientMessage[], isLoading: boolean) => {
    const scrollContainerRef = useRef<HTMLDivElement | null>(null);
    const messagesEndRef = useRef<HTMLDivElement | null>(null);
    const isUserScrollingRef = useRef(false);
    const scrollTimeoutRef = useRef<number | null>(null);
    const lastAutoScrollTimeRef = useRef(0);
    const lastMessageCountRef = useRef(messages.length);
    const lastContentLengthRef = useRef(0);

    // Detect when user is manually scrolling
    const handleScroll = useCallback(() => {
        if (!scrollContainerRef.current) return;

        const now = Date.now();
        // Ignore scroll events that happen too soon after auto-scroll
        if (now - lastAutoScrollTimeRef.current < 300) return;

        const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
        const distanceFromBottom = scrollHeight - scrollTop - clientHeight;

        // If user scrolled up more than 50px from bottom, they're manually scrolling
        isUserScrollingRef.current = distanceFromBottom > 50;

        // Clear any existing timeout
        if (scrollTimeoutRef.current) {
            clearTimeout(scrollTimeoutRef.current);
        }

        // Reset after 1.5 seconds of no scrolling if near bottom
        scrollTimeoutRef.current = window.setTimeout(() => {
            if (scrollContainerRef.current) {
                const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
                const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
                if (distanceFromBottom < 50) {
                    isUserScrollingRef.current = false;
                }
            }
        }, 1500);
    }, []);

    // Smooth scroll to bottom
    const scrollToBottom = useCallback(() => {
        if (isUserScrollingRef.current || !scrollContainerRef.current) return;

        const container = scrollContainerRef.current;
        const targetScroll = container.scrollHeight - container.clientHeight;
        const currentScroll = container.scrollTop;

        // If already at bottom, no need to scroll
        if (Math.abs(targetScroll - currentScroll) < 10) return;

        // Record auto-scroll time to ignore immediate scroll events
        lastAutoScrollTimeRef.current = Date.now();

        // Use smooth scrolling
        container.scrollTo({
            top: targetScroll,
            behavior: 'smooth'
        });
    }, []);

    // Callback ref for messages end marker
    const messagesEndCallbackRef = useCallback((node: HTMLDivElement | null) => {
        messagesEndRef.current = node;
        if (node && !isUserScrollingRef.current) {
            scrollToBottom();
        }
    }, [scrollToBottom]);

    // Track new messages and content updates (for streaming)
    useEffect(() => {
        const hasNewMessage = messages.length > lastMessageCountRef.current;
        lastMessageCountRef.current = messages.length;

        // Calculate total content length to detect streaming updates
        const currentContentLength = messages.reduce((sum, msg) =>
            sum + (msg.content?.length || 0), 0
        );
        const contentChanged = currentContentLength !== lastContentLengthRef.current;
        const hadContent = lastContentLengthRef.current > 0;
        lastContentLengthRef.current = currentContentLength;

        // Auto-scroll on new messages or content updates (streaming)
        // Skip first render (hadContent will be false)
        if (hadContent && (hasNewMessage || contentChanged)) {
            scrollToBottom();
        }
    }, [messages, scrollToBottom]);

    // Auto-scroll while loading/streaming
    useEffect(() => {
        if (!isLoading) return;

        // Scroll every 100ms while loading to handle streaming content
        const interval = setInterval(() => {
            scrollToBottom();
        }, 100);

        return () => clearInterval(interval);
    }, [isLoading, scrollToBottom]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (scrollTimeoutRef.current) {
                clearTimeout(scrollTimeoutRef.current);
            }
        };
    }, []);

    return {
        scrollContainerRef,
        messagesEndCallbackRef,
        handleScroll
    };
};
