declare const SuggerenceData: SuggerenceData;

export const WEBSOCKET_CONFIG = {
    DEFAULT_URL: 'wss://api.suggerence.com/v1/gutenberg/claude-text-wss',
    //DEFAULT_URL: 'ws://localhost:3000/v1/gutenberg/claude-text-wss',

    getWebSocketUrl: (): string => {
        return WEBSOCKET_CONFIG.DEFAULT_URL;
    },

    // Get API key from WordPress
    getApiKey: (): string => {
        const apiKey = SuggerenceData.api_key || 'sk-sgg-demo-key';
        return apiKey.replace('sk-sgg-', '');
    }
};
