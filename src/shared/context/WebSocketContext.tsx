import { createContext, useContext, useState, useEffect, useRef, useCallback } from '@wordpress/element';
import { WEBSOCKET_CONFIG } from '../config/websocket';

interface WebSocketContextValue {
    isConnected: boolean;
    sendRequest: (request: any, onMessage: (data: any) => void, onComplete: () => void) => void;
}

const WebSocketContext = createContext<WebSocketContextValue | null>(null);

export const useWebSocket = () => {
    const context = useContext(WebSocketContext);
    if (!context) {
        throw new Error('useWebSocket must be used within WebSocketProvider');
    }
    return context;
};

interface WebSocketProviderProps {
    children: React.ReactNode;
}

export const WebSocketProvider = ({ children }: WebSocketProviderProps) => {
    const [isConnected, setIsConnected] = useState(false);
    const wsRef = useRef<WebSocket | null>(null);
    const requestHandlersRef = useRef<Map<string, {
        onMessage: (data: any) => void;
        onComplete: () => void;
    }>>(new Map());
    const requestIdRef = useRef(0);

    const connect = useCallback(() => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            return;
        }

        const wsUrl = WEBSOCKET_CONFIG.getWebSocketUrl();

        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
            setIsConnected(true);
        };

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);

                // Route message to all active request handlers
                requestHandlersRef.current.forEach((handler) => {
                    handler.onMessage(data);

                    // If this is a 'done' or 'error' message, clean up
                    if (data.type === 'done' || data.type === 'error') {
                        handler.onComplete();
                    }
                });
            } catch (error) {
                console.error('Error parsing WebSocket message:', error);
            }
        };

        ws.onerror = (error) => {
            console.error('❌ Persistent WebSocket error:', error);
        };

        ws.onclose = () => {
            setIsConnected(false);
            wsRef.current = null;

            // Auto-reconnect after 3 seconds
            setTimeout(() => {
                connect();
            }, 3000);
        };
    }, []);

    const sendRequest = useCallback((request: any, onMessage: (data: any) => void, onComplete: () => void) => {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
            console.error('WebSocket not connected');
            return;
        }

        const requestId = `req_${++requestIdRef.current}`;
        requestHandlersRef.current.set(requestId, { onMessage, onComplete: () => {
            requestHandlersRef.current.delete(requestId);
            onComplete();
        }});

        wsRef.current.send(JSON.stringify(request));
    }, []);

    useEffect(() => {
        connect();

        return () => {
            if (wsRef.current) {
                wsRef.current.close();
            }
        };
    }, [connect]);

    return (
        <WebSocketContext.Provider value={{ isConnected, sendRequest }}>
            {children}
        </WebSocketContext.Provider>
    );
};
