import { useEffect, useRef, useCallback } from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';
import { useAutocompleteStore } from '../../stores/autocompleteStore';
import { useAutocompleteGenerator } from '../../hooks/useAutocompleteGenerator';

// Word counting utility
const countWords = (text: string): number => {
    if (!text || text.trim().length === 0) return 0;
    // Remove HTML tags and count words
    const plainText = text.replace(/<[^>]*>/g, ' ').trim();
    return plainText.split(/\s+/).filter((word) => word.length > 0).length;
};

// Strip HTML tags for plain text comparison
const stripHtml = (html: string): string => {
    return html.replace(/<[^>]*>/g, '');
};

export const ParagraphBlockFilter = () => {
    const debounceTimerRef = useRef<number | null>(null);
    const { generateSuggestion } = useAutocompleteGenerator();
    const {
        blockId: activeBlockId,
        suggestion,
        clearSuggestion,
        setLastContent,
        lastContent,
        lastWordCount,
    } = useAutocompleteStore();

    const { updateBlockAttributes } = useDispatch('core/block-editor') as any;

    // Log that the component mounted
    useEffect(() => {
        console.log('[Autocomplete] ParagraphBlockFilter mounted');
        return () => {
            console.log('[Autocomplete] ParagraphBlockFilter unmounted');
        };
    }, []);

    // Get the currently selected block
    const { selectedBlock, selectedBlockClientId } = useSelect((select) => {
        const blockEditor = select('core/block-editor') as any;
        const clientId = blockEditor.getSelectedBlockClientId();
        return {
            selectedBlock: clientId ? blockEditor.getBlock(clientId) : null,
            selectedBlockClientId: clientId,
        };
    }, []);

    // Clear suggestion when block changes
    useEffect(() => {
        if (selectedBlockClientId !== activeBlockId && suggestion) {
            clearSuggestion();
        }
    }, [selectedBlockClientId, activeBlockId, suggestion, clearSuggestion]);

    // Handle content changes with debouncing
    const handleContentChange = useCallback(
        (blockId: string, content: string) => {
            // Clear existing timer
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }

            // Clear suggestion while typing
            if (suggestion) {
                clearSuggestion();
            }

            // Get plain text for word counting
            const plainText = stripHtml(content);
            const currentWordCount = countWords(plainText);

            // Debug logging
            console.log('[Autocomplete] Content changed:', {
                currentWordCount,
                lastWordCount,
                newWords: currentWordCount - lastWordCount,
                plainText: plainText.substring(0, 100)
            });

            // Only trigger if we have at least 5 words total
            const hasMinimumWords = currentWordCount >= 5;

            if (!hasMinimumWords) {
                console.log('[Autocomplete] Not enough words yet:', currentWordCount);
                setLastContent(content, currentWordCount);
                return;
            }

            // Check if we have new words since last suggestion (only if we already generated one before)
            // For the first suggestion, just check minimum word count
            const newWords = currentWordCount - lastWordCount;
            const hasNewWords = newWords >= 2;
            const isFirstSuggestion = lastWordCount === 0;

            if (!isFirstSuggestion && !hasNewWords) {
                console.log('[Autocomplete] Not enough new words:', newWords);
                return; // Don't update setLastContent here, wait for them to add more words
            }

            console.log('[Autocomplete] Starting debounce timer...');

            // Debounce: wait 2 seconds after user stops typing
            debounceTimerRef.current = window.setTimeout(() => {
                console.log('[Autocomplete] Debounce timer fired');
                // Check if content is still the same (user stopped typing)
                if (stripHtml(content) === plainText && content.trim().length > 0) {
                    console.log('[Autocomplete] Generating suggestion for:', plainText.substring(0, 50));
                    setLastContent(content, currentWordCount);
                    generateSuggestion(blockId, plainText);
                } else {
                    console.log('[Autocomplete] Content changed during debounce, skipping');
                }
            }, 2000);
        },
        [
            generateSuggestion,
            clearSuggestion,
            suggestion,
            lastWordCount,
            setLastContent,
        ]
    );

    // Monitor selected paragraph block for content changes
    useEffect(() => {
        if (
            selectedBlock &&
            selectedBlock.name === 'core/paragraph' &&
            selectedBlockClientId
        ) {
            const content = selectedBlock.attributes?.content || '';
            const plainText = stripHtml(content);

            // Only trigger if content actually changed
            if (plainText !== stripHtml(lastContent)) {
                handleContentChange(selectedBlockClientId, content);
            }
        }

        return () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
        };
    }, [selectedBlock, selectedBlockClientId, handleContentChange, lastContent]);

    // Handle TAB key to accept suggestion
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            // Check if TAB is pressed and we have a suggestion
            if (event.key === 'Tab' && suggestion && activeBlockId) {
                event.preventDefault();
                event.stopPropagation();

                // Get the current block
                if (selectedBlock && selectedBlock.clientId === activeBlockId) {
                    const currentContent = selectedBlock.attributes?.content || '';

                    // Append suggestion to current content
                    const newContent = currentContent + suggestion;

                    // Update the block
                    updateBlockAttributes(activeBlockId, {
                        content: newContent,
                    });

                    // Clear the suggestion
                    clearSuggestion();

                    // Update last content
                    const plainText = stripHtml(newContent);
                    setLastContent(newContent, countWords(plainText));
                }
            } else if (event.key === 'Escape' && suggestion) {
                // ESC to dismiss suggestion
                event.preventDefault();
                clearSuggestion();
            }
        };

        document.addEventListener('keydown', handleKeyDown, true);
        return () => {
            document.removeEventListener('keydown', handleKeyDown, true);
        };
    }, [
        suggestion,
        activeBlockId,
        selectedBlock,
        updateBlockAttributes,
        clearSuggestion,
        setLastContent,
    ]);

    return null;
};
