import { create } from 'zustand';
import type { AutocompleteState } from './types';

interface AutocompleteStore extends AutocompleteState {
    setSuggestion: (blockId: string, suggestion: string) => void;
    clearSuggestion: () => void;
    setIsGenerating: (isGenerating: boolean) => void;
    setLastContent: (content: string, wordCount: number) => void;
}

export const useAutocompleteStore = create<AutocompleteStore>((set) => ({
    blockId: null,
    suggestion: '',
    isGenerating: false,
    lastContent: '',
    lastWordCount: 0,

    setSuggestion: (blockId, suggestion) => {
        console.log('[Autocomplete Store] setSuggestion called:', { blockId, suggestion: suggestion.substring(0, 50) });
        set({ blockId, suggestion, isGenerating: false });
    },

    clearSuggestion: () => {
        console.log('[Autocomplete Store] clearSuggestion called');
        set({ blockId: null, suggestion: '', isGenerating: false });
    },

    setIsGenerating: (isGenerating) => {
        console.log('[Autocomplete Store] setIsGenerating:', isGenerating);
        set({ isGenerating });
    },

    setLastContent: (lastContent, lastWordCount) => {
        console.log('[Autocomplete Store] setLastContent:', { wordCount: lastWordCount });
        set({ lastContent, lastWordCount });
    },
}));
