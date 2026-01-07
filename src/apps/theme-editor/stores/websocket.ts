import { create } from 'zustand';
import { THEME_EDITOR_WEBSOCKET_URL } from '../constants/api';
import { getWebsocketAuthToken } from '@/shared/auth/websocketToken';

interface WebsocketStore {
    socket: WebSocket | null;
    connected: boolean;
    messageHandlers: Set<(event: MessageEvent) => void>;
    connect: () => void;
    addMessageHandler: (handler: (event: MessageEvent) => void) => () => void;
    disconnect: () => void;
    send: (type: string, data: unknown) => void;
}

export const useWebsocketStore = create<WebsocketStore>((set, get) => ({
    socket: null,
    connected: false,
    messageHandlers: new Set(),

    connect: () => {
        const { socket } = get();

        if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
            return;
        }

        const connectWithToken = async () => {
            try {
                const token = await getWebsocketAuthToken();
                const ws = new WebSocket(`${THEME_EDITOR_WEBSOCKET_URL}?token=${encodeURIComponent(token)}`);

                ws.onopen = () => {
                    console.log('[Theme Editor] WebSocket connected');
                    set({ connected: true });
                };

                ws.onclose = () => {
                    console.log('[Theme Editor] WebSocket disconnected');
                    set({ connected: false, socket: null });
                };

                ws.onmessage = (event) => {
                    const { messageHandlers } = get();

                    for (const handler of messageHandlers) {
                        try {
                            handler(event);
                        } catch (error) {
                            console.error('[Theme Editor] Error handling message:', error);
                        }
                    }
                };

                ws.onerror = (error) => {
                    console.error('[Theme Editor] WebSocket error:', error);
                };

                set({ socket: ws });
            } catch (error) {
                console.error('[Theme Editor] WebSocket connection error:', error);
            }
        };

        void connectWithToken();
    },

    addMessageHandler: (handler: (event: MessageEvent) => void) => {
        const { messageHandlers } = get();
        messageHandlers.add(handler);

        return () => {
            messageHandlers.delete(handler);
        };
    },

    disconnect: () => {
        const { socket } = get();

        if (socket) {
            socket.close();
            set({ socket: null, connected: false });
        }
    },

    send: (type: string, data: unknown) => {
        const { socket, connected } = get();

        if (connected && socket) {
            socket.send(JSON.stringify({ type, data }));
        } else {
            console.warn('[Theme Editor] Cannot send message: Websocket not connected');
        }
    }
}));
