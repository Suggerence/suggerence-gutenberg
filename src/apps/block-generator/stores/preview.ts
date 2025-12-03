import { create } from 'zustand';

interface PreviewStore
{
    blocks: any[];
    setBlocks: (blocks: any[]) => void;
}

export const usePreviewStore = create<PreviewStore>((set) => ({
    blocks: [],
    setBlocks: (blocks) => set({ blocks }),
}));

