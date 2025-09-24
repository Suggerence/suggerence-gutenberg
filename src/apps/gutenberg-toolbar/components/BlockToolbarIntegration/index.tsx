import { useEffect } from '@wordpress/element';
import { ToolbarDropdownMenu, ToolbarGroup } from '@wordpress/components';
import { BlockControls } from '@wordpress/block-editor';
import { createHigherOrderComponent } from '@wordpress/compose';
import { addFilter } from '@wordpress/hooks';
import { __ } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { SuggerenceIcon } from '@/components/SuggerenceIcon';
import { CommandBox } from '@/apps/gutenberg-toolbar/components/CommandBox';

// Add toolbar button to all blocks
const withToolbarButton = createHigherOrderComponent((BlockEdit) => {
    return (props: any) => {
        // Check if current block is selected
        const isBlockSelected = useSelect((select) => {
            const selectedBlockId = select(blockEditorStore).getSelectedBlockClientId();
            return selectedBlockId === props.clientId;
        }, [props.clientId]);

        return (
            <>
                <BlockEdit {...props} />
                {isBlockSelected && (
                    <BlockControls>
                        <ToolbarGroup>
                            <ToolbarDropdownMenu
                                icon={<div style={{ color: '#d22178' }}><SuggerenceIcon /></div>}
                                label={__('AI Command', 'suggerence')}
                                popoverProps={{
                                    placement: 'bottom-start',
                                    offset: 8,
                                }}
                            >
                                {({ onClose }) => (
                                    <div style={{ padding: 0 }}>
                                        <CommandBox onClose={onClose} />
                                    </div>
                                )}
                            </ToolbarDropdownMenu>
                        </ToolbarGroup>
                    </BlockControls>
                )}
            </>
        );
    };
}, 'withToolbarButton');

export const BlockToolbarIntegration = () => {
    useEffect(() => {
        // Add the toolbar button to all blocks
        addFilter(
            'editor.BlockEdit',
            'suggerence/add-toolbar-button',
            withToolbarButton,
            20
        );
    }, []);

    return null;
};