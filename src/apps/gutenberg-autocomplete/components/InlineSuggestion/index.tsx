import { useEffect, useState } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { useAutocompleteStore } from '../../stores/autocompleteStore';

export const InlineSuggestion = () => {
    const { blockId, suggestion, isGenerating } = useAutocompleteStore();
    const [position, setPosition] = useState<{ top: number; left: number } | null>(null);

    // Debug logging
    useEffect(() => {
        console.log('[InlineSuggestion] State changed:', { blockId, hasSuggestion: !!suggestion, suggestionLength: suggestion?.length });
    }, [blockId, suggestion]);

    // Get the selected block element
    const { selectedBlockElement } = useSelect((select) => {
        const blockEditor = select('core/block-editor') as any;
        const clientId = blockEditor.getSelectedBlockClientId();

        if (!clientId || clientId !== blockId) {
            return { selectedBlockElement: null };
        }

        // Find the block element in the DOM
        const blockElement = document.querySelector(
            `[data-block="${clientId}"]`
        ) as HTMLElement;

        return { selectedBlockElement: blockElement };
    }, [blockId]);

    // Calculate position for the suggestion overlay
    useEffect(() => {
        console.log('[InlineSuggestion] Position effect triggered:', {
            hasBlockElement: !!selectedBlockElement,
            hasSuggestion: !!suggestion
        });

        if (!selectedBlockElement || !suggestion) {
            console.log('[InlineSuggestion] Missing block element or suggestion');
            setPosition(null);
            return;
        }

        // Find the contenteditable element within the block
        const editableElement = selectedBlockElement.querySelector(
            '[contenteditable="true"]'
        ) as HTMLElement;

        console.log('[InlineSuggestion] Editable element:', editableElement);

        if (!editableElement) {
            console.log('[InlineSuggestion] No editable element found');
            setPosition(null);
            return;
        }

        // Get the selection/cursor position
        const selection = window.getSelection();
        console.log('[InlineSuggestion] Selection:', selection);

        if (!selection || selection.rangeCount === 0) {
            console.log('[InlineSuggestion] No selection or range');
            setPosition(null);
            return;
        }

        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();

        console.log('[InlineSuggestion] Rect:', rect);

        const newPosition = {
            top: rect.bottom + window.scrollY,
            left: rect.left + window.scrollX,
        };

        console.log('[InlineSuggestion] Setting position:', newPosition);
        setPosition(newPosition);
    }, [selectedBlockElement, suggestion]);

    // Don't render anything if no suggestion or position
    if (!suggestion || !position || !blockId) {
        console.log('[InlineSuggestion] Not rendering:', { hasSuggestion: !!suggestion, hasPosition: !!position, hasBlockId: !!blockId });
        return null;
    }

    console.log('[InlineSuggestion] RENDERING suggestion at position:', position);

    return (
        <div
            className="suggerence-autocomplete-suggestion"
            style={{
                position: 'absolute',
                top: `${position.top}px`,
                left: `${position.left}px`,
                zIndex: 999999,
                pointerEvents: 'none',
            }}
        >
            <div
                style={{
                    display: 'inline-block',
                    color: '#9ca3af',
                    fontSize: 'inherit',
                    fontFamily: 'inherit',
                    lineHeight: 'inherit',
                    opacity: 0.6,
                    whiteSpace: 'pre-wrap',
                }}
            >
                {suggestion}
            </div>
            <div
                style={{
                    display: 'inline-block',
                    marginLeft: '8px',
                    padding: '2px 8px',
                    backgroundColor: 'rgba(99, 102, 241, 0.1)',
                    color: '#6366f1',
                    fontSize: '11px',
                    borderRadius: '4px',
                    border: '1px solid rgba(99, 102, 241, 0.2)',
                }}
            >
                Press TAB to accept
            </div>
        </div>
    );
};
