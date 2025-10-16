import { create } from 'zustand';

interface CommandState {
    isCommandBoxOpen: boolean;
    currentCommand: string;
    isExecuting: boolean;
    lastResult: string | null;
    position: { top: number; left: number } | null;
    openCommandBox: (position?: { top: number; left: number }) => void;
    closeCommandBox: () => void;
    setCommand: (command: string) => void;
    setExecuting: (executing: boolean) => void;
    setResult: (result: string | null) => void;
    clearResult: () => void;
}

export const useCommandStore = create<CommandState>((set) => ({
    isCommandBoxOpen: false,
    currentCommand: '',
    isExecuting: false,
    lastResult: null,
    position: null,

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
}));