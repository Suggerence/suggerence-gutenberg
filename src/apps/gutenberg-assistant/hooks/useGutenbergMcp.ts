import { useState, useEffect } from '@wordpress/element';
import { useGutenbergMCPStore } from '@/apps/gutenberg-toolbar/stores/gutenbergMcpStore';

export interface UseGutenbergMCPTools {
    isGutenbergServerReady: boolean;
    getGutenbergTools: () => Promise<SuggerenceMCPResponseTool[]>;
    callGutenbergTool: (toolName: string, args: Record<string, any>) => Promise<any>;
}

export const useGutenbergMCP = (): UseGutenbergMCPTools => {
    const { serverConnections } = useGutenbergMCPStore();
    const [isGutenbergServerReady, setIsGutenbergServerReady] = useState(true);

    // Initialize Gutenberg MCP server (already in store by default)
    useEffect(() => {
        const gutenbergServer = serverConnections.find(
            (conn) => conn.name === 'gutenberg'
        );

        if (!gutenbergServer) {
            setIsGutenbergServerReady(false);
        }
    }, [serverConnections]);

    const getGutenbergTools = async (): Promise<SuggerenceMCPResponseTool[]> => {
        const gutenbergServer = serverConnections.find(
            (conn) => conn.name === 'gutenberg'
        );

        if (!gutenbergServer || !gutenbergServer.client) {
            return [];
        }

        try {
            const response = await gutenbergServer.client.listTools();
            const tools = response.tools.map((tool: SuggerenceMCPResponseTool) => ({
                ...tool,
                name: `gutenberg___${tool.name}`
            }));

            // Debug: Log Gutenberg tools
            console.log('Suggerence Debug: Gutenberg sidebar tools generated:', tools);

            return tools;
        } catch (error) {
            console.error('Failed to get Gutenberg tools:', error);
            return [];
        }
    };

    const callGutenbergTool = async (toolName: string, args: Record<string, any>): Promise<any> => {
        const gutenbergServer = serverConnections.find(
            (conn) => conn.name === 'gutenberg'
        );

        if (!gutenbergServer || !gutenbergServer.client) {
            throw new Error('Gutenberg MCP server not available');
        }

        // Remove the 'gutenberg___' prefix if present
        const actualToolName = toolName.startsWith('gutenberg___')
            ? toolName.substring(12)
            : toolName;

        try {
            const response = await gutenbergServer.client.callTool({
                name: actualToolName,
                arguments: args
            });

            return {
                response: response.content[0]?.text || 'Command executed successfully',
                reflect_changes: false
            };
        } catch (error) {
            console.error(`Error calling Gutenberg tool ${toolName}:`, error);
            throw error;
        }
    };

    return {
        isGutenbergServerReady,
        getGutenbergTools,
        callGutenbergTool
    };
};