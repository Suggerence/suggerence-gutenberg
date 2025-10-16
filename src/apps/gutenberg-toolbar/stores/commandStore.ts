import { create } from 'zustand';

interface CommandState {
    isCommandBoxOpen: boolean;
    currentCommand: string;
    isExecuting: boolean;
    lastResult: string | null;
    position: { top: number; left: number } | null;
    processingBlocks: Set<string>;
    openCommandBox: (position?: { top: number; left: number }) => void;
    closeCommandBox: () => void;
    setCommand: (command: string) => void;
    setExecuting: (executing: boolean) => void;
    setResult: (result: string | null) => void;
    clearResult: () => void;
    setBlockProcessing: (clientId: string, isProcessing: boolean) => void;
    isBlockProcessing: (clientId: string) => boolean;
}

export const useCommandStore = create<CommandState>((set, get) => ({
    isCommandBoxOpen: false,
    currentCommand: '',
    isExecuting: false,
    lastResult: null,
    position: null,
    processingBlocks: new Set<string>(),

    openCommandBox: (position = { top: 100, left: 100 }) => set({
        isCommandBoxOpen: true,
        position
    }),
    closeCommandBox: () => set({
        isCommandBoxOpen: false,
        currentCommand: '',
        isExecuting: false,
        position: null
    }),
    setCommand: (command: string) => set({ currentCommand: command }),
    setExecuting: (executing: boolean) => set({ isExecuting: executing }),
    setResult: (result: string | null) => set({ lastResult: result }),
    clearResult: () => set({ lastResult: null }),
    setBlockProcessing: (clientId: string, isProcessing: boolean) => {
        const processingBlocks = new Set(get().processingBlocks);
        if (isProcessing) {
            processingBlocks.add(clientId);
        } else {
            processingBlocks.delete(clientId);
        }
        set({ processingBlocks });
    },
    isBlockProcessing: (clientId: string) => get().processingBlocks.has(clientId),
}));