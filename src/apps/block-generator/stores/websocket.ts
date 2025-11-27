import { create } from 'zustand';

import { BLOCKS_WEBSOCKET_URL } from '@/apps/block-generator/constants/api';

interface WebsocketStore
{
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

    connect: () => 
    {
        const { socket } = get();

        if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
            return;
        }

        try {
            const ws = new WebSocket(BLOCKS_WEBSOCKET_URL);

            ws.onopen = () =>
            {
                console.log('WebSocket connected');
                set({ connected: true });
            };

            ws.onclose = () =>
            {
                console.log('WebSocket disconnected');
                set({ connected: false, socket: null });
            };

            ws.onmessage = (event) =>
            {
                const { messageHandlers } = get();

                for (const handler of messageHandlers) {
                    try {
                        handler(event);
                    }
                    catch (error) {
                        console.error('Error handling message:', error);
                    }
                }
            };

            ws.onerror = (error) =>
            {
                console.error('WebSocket error:', error);
            };

            set({ socket: ws });
        }
        catch (error) {
            console.error('WebSocket connection error:', error);
        }
    },

    addMessageHandler: (handler: (event: MessageEvent) => void) =>
    {
        const { messageHandlers } = get();

        messageHandlers.add(handler);

        return () => {
            messageHandlers.delete(handler);
        };
    },

    disconnect: () =>
    {
        const { socket } = get();

        if (socket) {
            socket.close();
            set({ socket: null, connected: false });
        }
    },

    send: (type: string, data: unknown) =>
    {
        const { socket, connected } = get();

        if (connected && socket) {
            socket.send(JSON.stringify({ type, data }));
        }
        else {
            console.warn('Cannot send message: Websocket not connected');
        }
    }
}))