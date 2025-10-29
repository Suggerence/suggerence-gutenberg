import { create } from 'zustand';

interface ThinkingContentState {
    content: string;
    setContent: (content: string) => void;
}

export const useThinkingContentStore = create<ThinkingContentState>((set) => ({
    content: '',
    setContent: (content: string) => set({ content }),
}));
