import { create } from "zustand";

export const useChatInterfaceStore = create<ChatInterfaceStore>((set) => ({
    isLoading: false,
    setIsLoading: (isLoading) => set({ isLoading }),
    abortController: null,
    setAbortController: (abortController) => set({ abortController }),
}));