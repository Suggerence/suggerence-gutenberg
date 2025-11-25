import { create } from 'zustand';
import { GutenbergMCPServer } from '@/shared/mcps/servers/GutenbergMCPServer';
import { CodeExecutionMCPServer } from '@/shared/mcps/servers/CodeExecutionMCPServer';

interface GutenbergMCPStore {
    serverConnections: SuggerenceMCPServerConnection[];
    addServer(server: SuggerenceMCPServerConnection): Promise<void>;
    removeServer(serverName: string): void;
}

export const useGutenbergMCPStore = create<GutenbergMCPStore>((set) => ({
    serverConnections: [
        GutenbergMCPServer.initialize(),
        CodeExecutionMCPServer.initialize()
    ],
    addServer: async (server: SuggerenceMCPServerConnection) => {
        set((state) => {
            if (state.serverConnections.some((s) => s.name === server.name)) {
                console.error(`Suggerence: Gutenberg server ${server.name} already exists`);
                return state;
            }

            return {
                serverConnections: [...state.serverConnections, server]
            };
        });
    },
    removeServer: (serverName: string) => {
        set((state) => ({
            serverConnections: state.serverConnections.filter((server) => server.name !== serverName)
        }));
    }
}));
