import { createElement, useState, useRef, useEffect } from '@wordpress/element';
import { createHigherOrderComponent } from '@wordpress/compose';
import { addFilter } from '@wordpress/hooks';
import { useAutocompleteAI } from '../../hooks/useAutocompleteAI';

// Unique ID for the suggestion span
const SUGGESTION_SPAN_ID = 'suggerence-ai-suggestion';

// Style for the suggestion
const SUGGESTION_STYLE = `
    color: #9ca3af;
    opacity: 0.6;
    font-style: italic;
    pointer-events: none;
`;

// Word counting utility
const countWords = (text: string): number => {
    if (!text || text.trim().length === 0) return 0;
    const plainText = text.replace(/<[^>]*>/g, ' ').trim();
    return plainText.split(/\s+/).filter((word) => word.length > 0).length;
};

// Strip HTML tags
const stripHtml = (html: string): string => {
    return html.replace(/<[^>]*>/g, '');
};

// Remove suggestion span from content
const removeSuggestionSpan = (content: string): string => {
    return content.replace(
        new RegExp(`<span id="${SUGGESTION_SPAN_ID}"[^>]*>.*?</span>`, 'g'),
        ''
    );
};

/**
 * Higher-order component that wraps paragraph blocks with autocomplete functionality
 */
export const withAutocomplete = createHigherOrderComponent((BlockEdit) => {
    return (props: any) => {
        // Only process paragraph blocks
        if (props.name !== 'core/paragraph') {
            return createElement(BlockEdit, props);
        }

        const [aiSuggestion, setAISuggestion] = useState('');
        const [lastWordCount, setLastWordCount] = useState(0);
        const debounceTimerRef = useRef<number | null>(null);
        const { callAutocompleteAI } = useAutocompleteAI();
        const isProcessingRef = useRef(false);

        console.log('[BlockEditorWrapper] Rendering for block:', props.clientId);

        // Handle content changes
        const handleContentChange = async (newContent: string) => {
            console.log('[BlockEditorWrapper] Content changed:', newContent.substring(0, 50));

            // Clear existing timer
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }

            // Remove any existing suggestion span
            const contentWithoutSuggestion = removeSuggestionSpan(newContent);

            // Update the block content without suggestion
            if (newContent !== contentWithoutSuggestion) {
                props.setAttributes({ content: contentWithoutSuggestion });
                return;
            }

            // Get word count
            const plainText = stripHtml(contentWithoutSuggestion);
            const currentWordCount = countWords(plainText);

            console.log('[BlockEditorWrapper] Word count:', {
                current: currentWordCount,
                last: lastWordCount,
                newWords: currentWordCount - lastWordCount
            });

            // Check if we should generate a suggestion
            const hasMinimumWords = currentWordCount >= 5;
            if (!hasMinimumWords) {
                console.log('[BlockEditorWrapper] Not enough words yet');
                return;
            }

            const newWords = currentWordCount - lastWordCount;
            const isFirstSuggestion = lastWordCount === 0;
            const hasNewWords = newWords >= 2;

            if (!isFirstSuggestion && !hasNewWords) {
                console.log('[BlockEditorWrapper] Not enough new words');
                return;
            }

            console.log('[BlockEditorWrapper] Starting debounce timer...');

            // Debounce: wait 2 seconds after user stops typing
            debounceTimerRef.current = window.setTimeout(async () => {
                if (isProcessingRef.current) {
                    console.log('[BlockEditorWrapper] Already processing, skipping');
                    return;
                }

                isProcessingRef.current = true;

                try {
                    console.log('[BlockEditorWrapper] Generating suggestion...');
                    const suggestion = await callAutocompleteAI(plainText);

                    console.log('[BlockEditorWrapper] Received suggestion:', suggestion);

                    if (suggestion && suggestion.trim().length > 0) {
                        setAISuggestion(suggestion);
                        setLastWordCount(currentWordCount);

                        // Inject suggestion as a styled span
                        const suggestionSpan = `<span id="${SUGGESTION_SPAN_ID}" style="${SUGGESTION_STYLE}">${suggestion}</span>`;
                        const contentWithSuggestion = contentWithoutSuggestion + suggestionSpan;

                        console.log('[BlockEditorWrapper] Injecting suggestion into content');
                        props.setAttributes({ content: contentWithSuggestion });
                    } else {
                        console.log('[BlockEditorWrapper] No suggestion generated');
                    }
                } catch (error) {
                    console.error('[BlockEditorWrapper] Error generating suggestion:', error);
                } finally {
                    isProcessingRef.current = false;
                }
            }, 2000);
        };

        // Handle key down events
        const handleKeyDown = (event: KeyboardEvent) => {
            if (!aiSuggestion) {
                return;
            }

            console.log('[BlockEditorWrapper] Key pressed:', event.key);

            let replacementText = '';

            if (event.key === 'Tab') {
                event.preventDefault();
                event.stopPropagation();
                replacementText = aiSuggestion;
                console.log('[BlockEditorWrapper] TAB pressed, accepting suggestion');
            } else if (event.key === 'Escape') {
                event.preventDefault();
                replacementText = '';
                console.log('[BlockEditorWrapper] ESC pressed, dismissing suggestion');
            } else {
                // For any other key, remove the suggestion
                replacementText = '';
            }

            // Remove the suggestion span and optionally replace with actual text
            const currentContent = props.attributes.content || '';
            const contentWithoutSuggestion = removeSuggestionSpan(currentContent);
            const newContent = contentWithoutSuggestion + replacementText;

            props.setAttributes({ content: newContent });
            setAISuggestion('');

            // Update word count if accepted
            if (replacementText) {
                const plainText = stripHtml(newContent);
                setLastWordCount(countWords(plainText));
            }
        };

        // Override the onChange prop
        const originalOnChange = props.setAttributes;
        const enhancedProps = {
            ...props,
            setAttributes: (newAttributes: any) => {
                if (newAttributes.content !== undefined) {
                    handleContentChange(newAttributes.content);
                } else {
                    originalOnChange(newAttributes);
                }
            }
        };

        // Add keyboard listener
        useEffect(() => {
            document.addEventListener('keydown', handleKeyDown, true);
            return () => {
                document.removeEventListener('keydown', handleKeyDown, true);
            };
        }, [aiSuggestion, props.attributes.content]);

        return createElement(BlockEdit, enhancedProps);
    };
}, 'withAutocomplete');

/**
 * Register the filter
 */
export const registerAutocompleteFilter = () => {
    addFilter(
        'editor.BlockEdit',
        'suggerence/gutenberg-autocomplete',
        withAutocomplete
    );
    console.log('[BlockEditorWrapper] Autocomplete filter registered');
};
