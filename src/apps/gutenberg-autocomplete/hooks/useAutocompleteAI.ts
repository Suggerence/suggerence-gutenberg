import { useCallback } from '@wordpress/element';
import { requestTextCompletion } from '@/shared/api/text';

/**
 * Dedicated AI hook for autocomplete functionality
 * This bypasses the main assistant's system prompt and context
 */
export const useAutocompleteAI = () => {
    const callAutocompleteAI = useCallback(
        async (content: string): Promise<string> => {
            if (!content || content.trim().length === 0) {
                return '';
            }

            try {
                console.log('[Autocomplete AI] Calling AI for content:', content.substring(0, 50));

                // Simple system prompt for text continuation
                const systemPrompt = `You are a writing assistant that continues text naturally.
Your task is to provide a short, natural continuation of the given text (1-2 sentences maximum).
Do not repeat the input text. Only provide the continuation.
Match the tone and style of the input text.`;

                const userPrompt = `Continue this text naturally (1-2 sentences):

"${content}"

Provide only the continuation, no explanations or metadata.`;

                // Direct API call without the complex assistant context
                const response = await requestTextCompletion({
                    model: 'suggerence-v1',
                    provider: 'suggerence',
                    system: systemPrompt,
                    messages: [
                        {
                            role: 'user',
                            content: userPrompt,
                        },
                    ],
                });

                console.log('[Autocomplete AI] Raw API response:', response);

                // Extract the text from the response
                let suggestionText = '';

                if (response.content) {
                    suggestionText = response.content;
                } else if (Array.isArray(response.content)) {
                    for (const item of response.content) {
                        if (item.type === 'text' && item.text) {
                            suggestionText += item.text;
                        }
                    }
                }

                // Clean up the suggestion
                suggestionText = suggestionText.trim();

                console.log('[Autocomplete AI] After trim:', suggestionText);

                // Remove quotes if the AI added them
                if (
                    (suggestionText.startsWith('"') && suggestionText.endsWith('"')) ||
                    (suggestionText.startsWith("'") && suggestionText.endsWith("'"))
                ) {
                    suggestionText = suggestionText.slice(1, -1);
                    console.log('[Autocomplete AI] Removed quotes:', suggestionText);
                }

                // Add a space at the beginning if the content doesn't end with whitespace
                if (suggestionText && content && !content.endsWith(' ')) {
                    suggestionText = ' ' + suggestionText;
                }

                console.log('[Autocomplete AI] Final suggestion text:', suggestionText);
                return suggestionText;
            } catch (error) {
                console.error('[Autocomplete AI] Error generating suggestion:', error);
                return '';
            }
        },
        []
    );

    return { callAutocompleteAI };
};
