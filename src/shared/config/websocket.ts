export const WEBSOCKET_CONFIG = {
    DEFAULT_URL: 'wss://api.suggerence.com/v1/gutenberg/claude-text-wss',
    // DEFAULT_URL: 'wss://c831e75579a2.ngrok-free.app/v1/gutenberg/claude-text-wss',

    getWebSocketUrl: (): string => {
        return WEBSOCKET_CONFIG.DEFAULT_URL;
    }
};
