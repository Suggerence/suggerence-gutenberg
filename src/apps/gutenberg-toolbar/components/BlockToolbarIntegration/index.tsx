import { useEffect } from '@wordpress/element';
import { ToolbarDropdownMenu, ToolbarGroup } from '@wordpress/components';
import { BlockControls } from '@wordpress/block-editor';
import { createHigherOrderComponent } from '@wordpress/compose';
import { addFilter, removeFilter } from '@wordpress/hooks';
import { __ } from '@wordpress/i18n';
import { SuggerenceIcon } from '@/components/SuggerenceIcon';
import { CommandBox } from '@/apps/gutenberg-toolbar/components/CommandBox';
import type { BlockEditProps } from '@wordpress/blocks';

const withToolbarButton = createHigherOrderComponent(
	(BlockEdit : React.ComponentType<BlockEditProps<any>>) => {
		return (props : BlockEditProps<any>) => {
			if (!props.isSelected) {
				return <BlockEdit {...props} />;
			}

			return (
				<>
					<BlockEdit {...props} />
					<BlockControls>
						<ToolbarGroup>
							<ToolbarDropdownMenu
								icon={
									<div style={{ color: '#d22178' }}>
										<SuggerenceIcon />
									</div>
								}
								label={__('AI Command', 'suggerence')}
								toggleProps={{ 'aria-label': __('AI Command', 'suggerence') }}
								popoverProps={{ placement: 'bottom-start', offset: 8 }}
							>
								{({ onClose }) => (
									<div style={{ padding: 0 }}>
										<CommandBox onClose={onClose} />
									</div>
								)}
							</ToolbarDropdownMenu>
						</ToolbarGroup>
					</BlockControls>
				</>
			);
		};
	},
	'withToolbarButton'
);

export const BlockToolbarIntegration = () => {
	useEffect(() => {
		const hookName = 'suggerence/add-toolbar-button';
		addFilter('editor.BlockEdit', hookName, withToolbarButton, 20);

		return () => {
			removeFilter('editor.BlockEdit', hookName);
		};
	}, []);

	return null;
};
