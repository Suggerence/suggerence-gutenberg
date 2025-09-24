import { useSuggestionDetector } from '@/apps/gutenberg-suggestions/hooks/useSuggestionDetector';
import { SuggestionSnackbar } from '@/apps/gutenberg-suggestions/components/SuggestionSnackbar';
import { useAISuggestionGenerator } from '@/apps/gutenberg-suggestions/hooks/useAISuggestionGenerator';

export const SuggestionProvider = () => {
    useSuggestionDetector();
    useAISuggestionGenerator();

    return (
        <div className="suggerence-suggestions-provider">
            <SuggestionSnackbar />
        </div>
    );
};