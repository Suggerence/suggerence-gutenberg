import { useEffect, useState } from '@wordpress/element';
import {
	ToolbarDropdownMenu,
	ToolbarGroup,
	MenuGroup,
	MenuItem,
} from '@wordpress/components';
import { BlockControls } from '@wordpress/block-editor';
import { createHigherOrderComponent } from '@wordpress/compose';
import { addFilter, removeFilter } from '@wordpress/hooks';
import { __ } from '@wordpress/i18n';
import { useDispatch } from '@wordpress/data';
import { SuggerenceIcon } from '@/components/SuggerenceIcon';
import { CommandBox } from '@/apps/gutenberg-toolbar/components/CommandBox';
import { QuickActionsText } from '@/apps/gutenberg-toolbar/components/QuickActionsText';
import { QuickActionsImage } from '@/apps/gutenberg-toolbar/components/QuickActionsImage';
import { QuickActionsCode } from '@/apps/gutenberg-toolbar/components/QuickActionsCode';
import { generateEditedImage } from '@/shared/mcps/tools/image-generation';
import { useSnackbar } from '@/shared/hooks/useSnackbar';
import type { BlockEditProps } from '@wordpress/blocks';

const withToolbarButton = createHigherOrderComponent(
	(BlockEdit : React.ComponentType<BlockEditProps<any>>) => {
		return (props : BlockEditProps<any>) => {
			const [showCommandBox, setShowCommandBox] = useState(false);
			const [commandBoxMode, setCommandBoxMode] = useState<'default' | 'image-edit'>('default');
			const [isProcessing, setIsProcessing] = useState(false);
			const { updateBlockAttributes } = useDispatch('core/block-editor') as any;
			const { createErrorSnackbar, createSuccessSnackbar } = useSnackbar();

			if (!props.isSelected) {
				return <BlockEdit {...props} />;
			}

		const isText = props.name === 'core/paragraph' || props.name === 'core/heading' || props.name === 'core/quote' || props.name === 'core/preformatted' || props.name === 'core/verse' || props.name === 'core/list-item';
		const isImage = props.name === 'core/image' || props.name === 'core/cover';
		const isCode = props.name === 'core/code';
		const blockContent = props.attributes?.content || '';
		const imageUrl = props.attributes?.url;
		const imageId = props.attributes?.id;

			// Get the block wrapper props to add custom class
			const blockProps = props.wrapperProps || {};
			const customClassName = isProcessing ? 'suggerence-thinking' : '';

			// Merge the className with existing classes
			const mergedProps = {
				...props,
				wrapperProps: {
					...blockProps,
					className: blockProps.className
						? `${blockProps.className} ${customClassName}`.trim()
						: customClassName
				}
			};

			// Image edit execute function
			const handleImageEdit = async (command: string) => {
				if (!imageUrl) return false;

				try {
					const result = await generateEditedImage(command, imageUrl);
					const response = JSON.parse(result.content[0].text);

					if (response.success && response.data) {
						updateBlockAttributes(props.clientId, {
							id: response.data.image_id,
							url: response.data.image_url,
							alt: response.data.alt_text
						});
						createSuccessSnackbar(__('Image edited successfully!', 'suggerence'));
						return true;
					}
					createErrorSnackbar(__('Failed to edit image. Please try again.', 'suggerence'));
					return false;
				} catch (error) {
					createErrorSnackbar(__('An error occurred while editing the image.', 'suggerence'));
					console.error('Error editing image:', error);
					return false;
				}
			};

		if(!isText && !isImage && !isCode) {
			return <BlockEdit {...mergedProps} />;
		}

			return (
				<>
					<BlockEdit {...mergedProps} />
					<BlockControls>
						<ToolbarGroup>
							<ToolbarDropdownMenu
								icon={
									<div style={{ color: '#d22178' }}>
										<SuggerenceIcon />
									</div>
								}
								label={__('AI Assistant', 'suggerence')}
								toggleProps={{ 'aria-label': __('AI Assistant', 'suggerence') }}
								popoverProps={{
									placement: 'bottom-start',
									offset: 8
								}}
								onToggle={(isOpen) => {
									// Reset commandbox state when dropdown closes
									if (!isOpen) {
										setShowCommandBox(false);
										setCommandBoxMode('default');
									}
								}}
							>
								{({ onClose }) => {
									if (showCommandBox) {
										return (
											<div style={{ padding: 0 }}>
												<CommandBox
													onClose={() => {
														setShowCommandBox(false);
														setCommandBoxMode('default');
														onClose();
													}}
													onExecute={commandBoxMode === 'image-edit' ? handleImageEdit : undefined}
													placeholder={
														commandBoxMode === 'image-edit'
															? __('Describe how to edit this image (e.g., "change background to sunset", "remove the person")', 'suggerence')
															: undefined
													}
													mode={commandBoxMode}
												/>
											</div>
										);
									}

									return (
										<>
											{/* {isText && (
												<MenuGroup>
													<MenuItem
														onClick={() => {
															setCommandBoxMode('default');
															setShowCommandBox(true);
														}}
													>
														{__('AI Command', 'suggerence')}
													</MenuItem>
												</MenuGroup>
											)} */}

											{isText && (
												<QuickActionsText
													blockContent={blockContent}
													clientId={props.clientId}
													onClose={onClose}
													isProcessing={isProcessing}
													setIsProcessing={setIsProcessing}
												/>
											)}

											{isImage && (
												<QuickActionsImage
													imageUrl={imageUrl}
													imageId={imageId}
													clientId={props.clientId}
													onClose={onClose}
													onShowEditCommand={() => {
														setCommandBoxMode('image-edit');
														setShowCommandBox(true);
													}}
												/>
											)}

											{isCode && (
												<QuickActionsCode
													blockContent={blockContent}
													clientId={props.clientId}
													onClose={onClose}
													isProcessing={isProcessing}
													setIsProcessing={setIsProcessing}
												/>
											)}
										</>
									);
								}}
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
