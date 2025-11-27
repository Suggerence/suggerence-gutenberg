import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface BlocksStore
{
    blockId: string | undefined;
    setBlockId: (blockId: string | undefined) => void;
    selectedBlockId: string | undefined;
    setSelectedBlockId: (selectedBlockId: string | undefined) => void;
}

export const useBlocksStore = create<BlocksStore>()(
    persist(
        (set) => ({
            blockId: undefined,
            setBlockId: (blockId) => set({ blockId }),
            selectedBlockId: undefined,
            setSelectedBlockId: (selectedBlockId) => set({ selectedBlockId }),
        }),
        { name: 'suggerence-blocks-blocks', storage: createJSONStorage(() => localStorage) }
    )
);