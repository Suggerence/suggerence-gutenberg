import { useEffect } from '@wordpress/element';
import { ToolbarButton, ToolbarGroup, KeyboardShortcuts } from '@wordpress/components';
import { BlockControls } from '@wordpress/block-editor';
import { createHigherOrderComponent } from '@wordpress/compose';
import { addFilter } from '@wordpress/hooks';
import { comment } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';

import { useCommandStore } from '../../stores/commandStore';

// Add toolbar button to all blocks
const withToolbarButton = createHigherOrderComponent((BlockEdit) => {
    return (props: any) => {
        const { openCommandBox } = useCommandStore();

        const handleClick = (event: React.MouseEvent) => {
            // Get click position for positioning the command box
            const rect = (event.target as HTMLElement).getBoundingClientRect();
            const position = {
                top: rect.bottom + 10,
                left: rect.left
            };
            openCommandBox(position);
        };

        return (
            <>
                <BlockEdit {...props} />
                <BlockControls>
                    <ToolbarGroup>
                        <ToolbarButton
                            icon={comment}
                            label={__('AI Command', 'suggerence')}
                            onClick={handleClick}
                            shortcut={{
                                display: '⌘⇧K',
                                ariaLabel: 'AI Command'
                            }}
                        />
                    </ToolbarGroup>
                </BlockControls>
            </>
        );
    };
}, 'withToolbarButton');

export const BlockToolbarIntegration = () => {
    const { openCommandBox } = useCommandStore();

    const selectedBlockClientId = useSelect((select) => {
        return select(blockEditorStore).getSelectedBlockClientId();
    }, []);

    useEffect(() => {
        // Add the toolbar button to all blocks
        addFilter(
            'editor.BlockEdit',
            'suggerence/add-toolbar-button',
            withToolbarButton,
            20
        );

        // Cleanup function to remove filter
        return () => {
            // Note: WordPress doesn't provide removeFilter for this hook,
            // but the component unmount handles this
        };
    }, []);

    const handleGlobalShortcut = () => {
        let position;

        if (selectedBlockClientId) {
            // Get the DOM element for the selected block
            const blockElement = document.querySelector(`[data-block="${selectedBlockClientId}"]`);

            if (blockElement) {
                const blockRect = blockElement.getBoundingClientRect();
                position = {
                    top: blockRect.top + 10,
                    left: Math.max(10, blockRect.left)
                };
            }
        }

        // Fallback to center if no block is selected or found
        if (!position) {
            position = {
                top: window.innerHeight / 2,
                left: window.innerWidth / 2 - 210 // Center horizontally (assuming 420px width)
            };
        }

        openCommandBox(position);
    };

    return (
        <KeyboardShortcuts
            shortcuts={{
                'mod+shift+k': handleGlobalShortcut,
            }}
        />
    );
};