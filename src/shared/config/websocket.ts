export const WEBSOCKET_CONFIG = {
    DEFAULT_URL: 'wss://api.suggerence.com/v1/gutenberg/wss',

    getWebSocketUrl: (): string => {
        return WEBSOCKET_CONFIG.DEFAULT_URL;
    }
};
