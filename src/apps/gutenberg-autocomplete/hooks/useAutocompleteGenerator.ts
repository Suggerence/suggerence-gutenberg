import { useCallback } from '@wordpress/element';
import { useAutocompleteStore } from '../stores/autocompleteStore';
import { useAutocompleteAI } from './useAutocompleteAI';

export const useAutocompleteGenerator = () => {
    const { callAutocompleteAI } = useAutocompleteAI();
    const { setSuggestion, setIsGenerating, clearSuggestion } = useAutocompleteStore();

    const generateSuggestion = useCallback(
        async (blockId: string, content: string) => {
            console.log('[Autocomplete Generator] generateSuggestion called for blockId:', blockId);

            if (!content || content.trim().length === 0) {
                console.log('[Autocomplete Generator] No content, clearing');
                clearSuggestion();
                return;
            }

            console.log('[Autocomplete Generator] Setting isGenerating to true');
            setIsGenerating(true);

            try {
                const suggestionText = await callAutocompleteAI(content);

                console.log('[Autocomplete Generator] Received suggestion:', suggestionText);

                if (suggestionText) {
                    console.log('[Autocomplete Generator] Setting suggestion for block:', blockId);
                    setSuggestion(blockId, suggestionText);
                } else {
                    console.log('[Autocomplete Generator] No suggestion text, clearing');
                    clearSuggestion();
                }
            } catch (error) {
                console.error('[Autocomplete Generator] Error generating suggestion:', error);
                clearSuggestion();
            }
        },
        [callAutocompleteAI, setSuggestion, setIsGenerating, clearSuggestion]
    );

    return { generateSuggestion };
};
