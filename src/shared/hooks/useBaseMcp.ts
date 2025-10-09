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

    const callTool = async (toolName: string, args: Record<string, any>, signal?: AbortSignal): Promise<any> => {
        const server = serverConnections.find(
            (conn) => conn.name === config.serverName
        );

        if (!server || !server.client) {
            throw new Error(`${config.debugName} MCP server not available`);
        }

        // Check if aborted before starting
        if (signal?.aborted) {
            throw new DOMException('Aborted', 'AbortError');
        }

        // Remove the tool prefix if present
        const actualToolName = toolName.startsWith(config.toolPrefix)
            ? toolName.substring(config.toolPrefix.length)
            : toolName;

        try {
            // Create a promise that rejects when aborted
            const toolPromise = server.client.callTool({
                name: actualToolName,
                arguments: args
            });

            if (signal) {
                // Race between tool execution and abort
                const abortPromise = new Promise<never>((_, reject) => {
                    signal.addEventListener('abort', () => {
                        reject(new DOMException('Aborted', 'AbortError'));
                    });
                });

                const response = await Promise.race([toolPromise, abortPromise]);

                return {
                    response: response.content[0]?.text || 'Command executed successfully',
                    reflect_changes: false
                };
            } else {
                const response = await toolPromise;
                return {
                    response: response.content[0]?.text || 'Command executed successfully',
                    reflect_changes: false
                };
            }
        } catch (error) {
            // Propagate abort errors
            if (error instanceof DOMException && error.name === 'AbortError') {
                throw error;
            }
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