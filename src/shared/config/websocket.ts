// WebSocket configuration for direct API calls
export const WEBSOCKET_CONFIG = {
    // Default WebSocket URL - can be overridden via environment or WordPress settings
    DEFAULT_URL: 'ws://localhost:3000/v1/gutenberg/text-wss',

    // Get WebSocket URL from WordPress settings or environment
    getWebSocketUrl: (): string => {
        // Check if URL is set in WordPress settings
        const wpUrl = (window as any).suggerenceWebSocketUrl;
        if (wpUrl) {
            return wpUrl;
        }

        // Check environment variable (if available)
        const envUrl = (window as any).REACT_APP_WEBSOCKET_URL;
        if (envUrl) {
            return envUrl;
        }

        // Fall back to default
        let url = WEBSOCKET_CONFIG.DEFAULT_URL;

        // IMPORTANT: If the page is loaded over HTTPS, we need to use WSS (secure WebSocket)
        // Browsers block WS connections from HTTPS pages (mixed content)
        // For local development, either:
        // 1. Access WordPress via HTTP (http://sitemait.lndo.site)
        // 2. Set up SSL for the WebSocket server

        // Auto-detect: If we're on HTTPS and using ws://, warn the user
        if (window.location.protocol === 'https:' && url.startsWith('ws://')) {
            console.warn('⚠️ WEBSOCKET WARNING: You are on HTTPS but trying to connect to an unsecured WebSocket (ws://)');
            console.warn('⚠️ This will be blocked by the browser due to mixed content security.');
            console.warn('⚠️ Solutions:');
            console.warn('   1. Access WordPress via HTTP: http://sitemait.lndo.site (easiest for local dev)');
            console.warn('   2. Set up SSL for the WebSocket server (use wss://)');
            console.warn('   3. Override the URL via window.suggerenceWebSocketUrl = "wss://your-secure-ws-url"');

            // Don't auto-convert as the server might not support WSS
            // Users should explicitly configure this
        }

        return url;
    },

    // Get API key from WordPress
    getApiKey: (): string => {
        const apiKey = (window as any).suggerenceApiKey || 'sk-sgg-demo-key';
        // Remove 'sk-sgg-' prefix if present (it will be added by the server)
        return apiKey.replace('sk-sgg-', '');
    }
};
