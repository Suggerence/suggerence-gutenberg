import { create } from 'zustand';

interface SuggestionStore {
    activeSuggestion: Suggestion | null;
    isGenerating: boolean;

    setActiveSuggestion: (suggestion: Suggestion | null) => void;
    setIsGenerating: (generating: boolean) => void;
    clearSuggestion: () => void;
}

export const useSuggestionStore = create<SuggestionStore>((set) => ({
    activeSuggestion: null,
    isGenerating: false,

    setActiveSuggestion: (suggestion) => set({ activeSuggestion: suggestion }),
    setIsGenerating: (generating) => set({ isGenerating: generating }),
    clearSuggestion: () => set({ activeSuggestion: null, isGenerating: false }),
}));