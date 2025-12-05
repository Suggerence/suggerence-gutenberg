import { createContext, useContext, useState, useEffect, useRef, useCallback } from '@wordpress/element';
import { WEBSOCKET_CONFIG } from '../config/websocket';

interface WebSocketContextValue {
    isConnected: boolean;
    sendRequest: (request: any, onMessage: (data: any) => void, onComplete: () => void) => void;
}

interface ActiveRequestHandler {
    clientRequestId: string;
    remoteRequestIds: Set<string>;
    onMessage: (data: any) => void;
    onComplete: () => void;
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
    const requestHandlersRef = useRef<Map<string, ActiveRequestHandler>>(new Map());
    const requestIdRef = useRef(0);

    const cleanupHandler = useCallback((clientRequestId: string) => {
        const handler = requestHandlersRef.current.get(clientRequestId);
        if (!handler) {
            return;
        }

        requestHandlersRef.current.delete(clientRequestId);
        handler.onComplete();
    }, []);

    const resolveHandlerForIncomingMessage = useCallback((data: any): ActiveRequestHandler | null => {
        if (requestHandlersRef.current.size === 0) {
            return null;
        }

        const extractRequestId = (payload: any): string | null => {
            if (!payload || typeof payload !== 'object') {
                return null;
            }

            const directId = payload.requestId || payload.request_id;
            if (typeof directId === 'string' && directId.length > 0) {
                return directId;
            }

            const meta = payload.meta || payload.metadata || payload.message;
            if (meta && typeof meta === 'object') {
                const metaId = meta.requestId || meta.request_id || meta.id || meta.message_id;
                if (typeof metaId === 'string' && metaId.length > 0) {
                    return metaId;
                }
            }

            return null;
        };

        const incomingRequestId = extractRequestId(data);

        if (incomingRequestId) {
            // Direct match with a client-side request id
            const directMatch = requestHandlersRef.current.get(incomingRequestId);
            if (directMatch) {
                return directMatch;
            }

            // Check if this id was previously associated with a handler (remote id)
            for (const handler of requestHandlersRef.current.values()) {
                if (handler.remoteRequestIds.has(incomingRequestId)) {
                    return handler;
                }
            }

            // Associate the remote id with the most recent handler as a best-effort fallback
            const entries = Array.from(requestHandlersRef.current.values());
            const latestHandler = entries[entries.length - 1];
            if (latestHandler) {
                latestHandler.remoteRequestIds.add(incomingRequestId);
                return latestHandler;
            }
        }

        // No request id in the payload - route to the latest active handler
        const entries = Array.from(requestHandlersRef.current.values());
        return entries[entries.length - 1] || null;
    }, []);

    const connect = useCallback(() => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            return;
        }

        const wsUrl = WEBSOCKET_CONFIG.getWebSocketUrl();
        const apiKey = WEBSOCKET_CONFIG.getApiKey();

        const ws = new WebSocket(wsUrl + '?api_key=' + apiKey);
        wsRef.current = ws;

        ws.onopen = () => {
            setIsConnected(true);
        };

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);

                const handler = resolveHandlerForIncomingMessage(data);
                if (!handler) {
                    console.warn('Received WebSocket message with no active handler', data);
                    return;
                }

                handler.onMessage(data);

                if (data.type === 'done' || data.type === 'error') {
                    cleanupHandler(handler.clientRequestId);
                }
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

        const clientRequestId = `req_${++requestIdRef.current}`;
        requestHandlersRef.current.set(clientRequestId, {
            clientRequestId,
            remoteRequestIds: new Set([clientRequestId]),
            onMessage,
            onComplete
        });

        const payload = {
            ...request,
            requestId: clientRequestId,
            clientRequestId
        };

        wsRef.current.send(JSON.stringify(payload));
    }, []);

    useEffect(() => {
        connect();

        return () => {
            // Ensure all pending handlers are completed when the provider unmounts
            requestHandlersRef.current.forEach((handler) => {
                cleanupHandler(handler.clientRequestId);
            });

            if (wsRef.current) {
                wsRef.current.close();
            }
        };
    }, [cleanupHandler, connect]);

    return (
        <WebSocketContext.Provider value={{ isConnected, sendRequest }}>
            {children}
        </WebSocketContext.Provider>
    );
};
