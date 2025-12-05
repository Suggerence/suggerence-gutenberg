import { useEffect, useState } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { useAutocompleteStore } from '../../stores/autocompleteStore';
import { Loader2 } from 'lucide-react';

export const LoadingIndicator = () => {
    const { blockId, isGenerating } = useAutocompleteStore();
    const [position, setPosition] = useState<{ top: number; left: number } | null>(null);

    // Get the selected block element
    const { selectedBlockElement } = useSelect((select) => {
        const blockEditor = select('core/block-editor') as any;
        const clientId = blockEditor.getSelectedBlockClientId();

        if (!clientId || clientId !== blockId) {
            return { selectedBlockElement: null };
        }

        const blockElement = document.querySelector(
            `[data-block="${clientId}"]`
        ) as HTMLElement;

        return { selectedBlockElement: blockElement };
    }, [blockId]);

    // Calculate position for the loading indicator
    useEffect(() => {
        if (!selectedBlockElement || !isGenerating) {
            setPosition(null);
            return;
        }

        const editableElement = selectedBlockElement.querySelector(
            '[contenteditable="true"]'
        ) as HTMLElement;

        if (!editableElement) {
            setPosition(null);
            return;
        }

        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) {
            setPosition(null);
            return;
        }

        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();

        setPosition({
            top: rect.bottom + window.scrollY,
            left: rect.left + window.scrollX,
        });
    }, [selectedBlockElement, isGenerating]);

    if (!isGenerating || !position || !blockId) {
        return null;
    }

    return (
        <div
            className="suggerence-autocomplete-loading"
            style={{
                position: 'absolute',
                top: `${position.top}px`,
                left: `${position.left}px`,
                zIndex: 999999,
                pointerEvents: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 8px',
                backgroundColor: 'rgba(99, 102, 241, 0.1)',
                borderRadius: '4px',
                fontSize: '12px',
                color: '#6366f1',
            }}
        >
            <Loader2 size={14} className="animate-spin" />
            <span>Generating...</span>
        </div>
    );
};
