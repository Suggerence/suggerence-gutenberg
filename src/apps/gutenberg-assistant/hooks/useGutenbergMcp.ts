import { useGutenbergMCPStore } from '@/apps/gutenberg-toolbar/stores/gutenbergMcpStore';
import { useBaseMCP } from '@/shared/hooks/useBaseMcp';

export const useGutenbergMCP = (): UseGutenbergMCPTools => {
    const { serverConnections } = useGutenbergMCPStore();

    const {
        isServerReady: isGutenbergServerReady,
        getTools: getGutenbergTools,
        callTool: callGutenbergTool
    } = useBaseMCP(
        {
            serverName: 'gutenberg',
            debugName: 'Gutenberg sidebar',
            toolPrefix: 'gutenberg___'
        },
        serverConnections
    );

    return {
        isGutenbergServerReady,
        getGutenbergTools,
        callGutenbergTool
    };
};