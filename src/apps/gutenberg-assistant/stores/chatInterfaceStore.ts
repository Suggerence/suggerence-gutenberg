import { create } from "zustand";

interface ChatInterfaceStore {
    isLoading: boolean;
    setIsLoading: (isLoading: boolean) => void;
}

export const useChatInterfaceStore = create<ChatInterfaceStore>((set) => ({
    isLoading: false,
    setIsLoading: (isLoading) => set({ isLoading }),
}));