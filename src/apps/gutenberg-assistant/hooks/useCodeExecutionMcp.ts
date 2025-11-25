import { useGutenbergMCPStore } from '@/apps/gutenberg-toolbar/stores/gutenbergMcpStore';
import { useBaseMCP } from '@/shared/hooks/useBaseMcp';

export const useCodeExecutionMCP = (): UseGutenbergMCPTools => {
    const { serverConnections } = useGutenbergMCPStore();

    const {
        isServerReady,
        getTools,
        callTool
    } = useBaseMCP(
        {
            serverName: 'code_execution',
            debugName: 'Code execution workspace',
            toolPrefix: 'codeexec___'
        },
        serverConnections
    );

    return {
        isGutenbergServerReady: isServerReady,
        getGutenbergTools: getTools,
        callGutenbergTool: callTool
    };
};
