import { useState, useEffect, useRef, useCallback } from '@wordpress/element';
import { WEBSOCKET_CONFIG } from '../config/websocket';

type MessageHandler = (data: any) => void;
type ErrorHandler = (error: Error) => void;

interface UseWebSocketConnectionReturn {
    isConnected: boolean;
    sendMessage: (message: any) => void;
    onMessage: (handler: MessageHandler) => void;
    onError: (handler: ErrorHandler) => void;
    connect: () => void;
    disconnect: () => void;
}

/**
 * Manages a persistent WebSocket connection
 * Reuses the same connection for multiple AI requests
 */
export const useWebSocketConnection = (): UseWebSocketConnectionReturn => {
    const [isConnected, setIsConnected] = useState(false);
    const wsRef = useRef<WebSocket | null>(null);
    const messageHandlersRef = useRef<Set<MessageHandler>>(new Set());
    const errorHandlersRef = useRef<Set<ErrorHandler>>(new Set());
    const reconnectTimeoutRef = useRef<number | null>(null);
    const shouldReconnectRef = useRef(true);

    const connect = useCallback(() => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            console.log('WebSocket already connected');
            return;
        }

        const apiKey = WEBSOCKET_CONFIG.getApiKey();
        const wsUrl = WEBSOCKET_CONFIG.getWebSocketUrl();

        console.log('🔌 Connecting to WebSocket:', wsUrl);

        try {
            const ws = new WebSocket(wsUrl);
            wsRef.current = ws;

            ws.onopen = () => {
                console.log('✅ WebSocket connected');
                setIsConnected(true);

                // Clear reconnect timeout
                if (reconnectTimeoutRef.current) {
                    clearTimeout(reconnectTimeoutRef.current);
                    reconnectTimeoutRef.current = null;
                }
            };

            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    console.log('📦 WebSocket message:', data.type);

                    // Notify all registered handlers
                    messageHandlersRef.current.forEach(handler => {
                        try {
                            handler(data);
                        } catch (error) {
                            console.error('Error in message handler:', error);
                        }
                    });
                } catch (error) {
                    console.error('Error parsing WebSocket message:', error);
                }
            };

            ws.onerror = (error) => {
                console.error('❌ WebSocket error:', error);

                const errorObj = new Error('WebSocket connection error');
                errorHandlersRef.current.forEach(handler => {
                    try {
                        handler(errorObj);
                    } catch (err) {
                        console.error('Error in error handler:', err);
                    }
                });
            };

            ws.onclose = (event) => {
                console.log('🔌 WebSocket closed:', event.code, event.reason);
                setIsConnected(false);
                wsRef.current = null;

                // Auto-reconnect if not manually disconnected
                if (shouldReconnectRef.current) {
                    console.log('⏰ Reconnecting in 3 seconds...');
                    reconnectTimeoutRef.current = window.setTimeout(() => {
                        connect();
                    }, 3000);
                }
            };
        } catch (error) {
            console.error('Failed to create WebSocket:', error);
            setIsConnected(false);
        }
    }, []);

    const disconnect = useCallback(() => {
        console.log('Disconnecting WebSocket');
        shouldReconnectRef.current = false;

        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = null;
        }

        if (wsRef.current) {
            wsRef.current.close();
            wsRef.current = null;
        }

        setIsConnected(false);
    }, []);

    const sendMessage = useCallback((message: any) => {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
            console.error('Cannot send message: WebSocket not connected');
            throw new Error('WebSocket not connected');
        }

        console.log('📤 Sending message:', message.type);
        wsRef.current.send(JSON.stringify(message));
    }, []);

    const onMessage = useCallback((handler: MessageHandler) => {
        messageHandlersRef.current.add(handler);

        // Return cleanup function
        return () => {
            messageHandlersRef.current.delete(handler);
        };
    }, []);

    const onError = useCallback((handler: ErrorHandler) => {
        errorHandlersRef.current.add(handler);

        // Return cleanup function
        return () => {
            errorHandlersRef.current.delete(handler);
        };
    }, []);

    // Auto-connect on mount
    useEffect(() => {
        connect();

        return () => {
            disconnect();
        };
    }, [connect, disconnect]);

    return {
        isConnected,
        sendMessage,
        onMessage,
        onError,
        connect,
        disconnect
    };
};
