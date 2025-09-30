import { useState, useEffect } from '@wordpress/element';

export const useBaseMCP = (
    config: UseBaseMCPConfig,
    serverConnections: MCPServerConnection[]
): UseBaseMCPReturn => {
    const [isServerReady, setIsServerReady] = useState(false);

    useEffect(() => {
        const server = serverConnections.find(
            (conn) => conn.name === config.serverName
        );

        setIsServerReady(!!server);
    }, [serverConnections, config.serverName]);

    const getTools = async (): Promise<SuggerenceMCPResponseTool[]> => {
        const server = serverConnections.find(
            (conn) => conn.name === config.serverName
        );

        if (!server || !server.client) {
            return [];
        }

        try {
            const response = await server.client.listTools();
            const tools = response.tools.map((tool: SuggerenceMCPResponseTool) => ({
                ...tool,
                name: `${config.toolPrefix}${tool.name}`
            }));

            return tools;
        } catch (error) {
            console.error(`Failed to get ${config.debugName} tools:`, error);
            return [];
        }
    };

    const callTool = async (toolName: string, args: Record<string, any>): Promise<any> => {
        const server = serverConnections.find(
            (conn) => conn.name === config.serverName
        );

        if (!server || !server.client) {
            throw new Error(`${config.debugName} MCP server not available`);
        }

        // Remove the tool prefix if present
        const actualToolName = toolName.startsWith(config.toolPrefix)
            ? toolName.substring(config.toolPrefix.length)
            : toolName;

        try {
            const response = await server.client.callTool({
                name: actualToolName,
                arguments: args
            });

            return {
                response: response.content[0]?.text || 'Command executed successfully',
                reflect_changes: false
            };
        } catch (error) {
            console.error(`Error calling ${config.debugName} tool ${toolName}:`, error);
            throw error;
        }
    };

    return {
        isServerReady,
        getTools,
        callTool
    };
};