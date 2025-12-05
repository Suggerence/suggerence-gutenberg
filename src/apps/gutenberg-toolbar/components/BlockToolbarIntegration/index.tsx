import { useEffect, useState } from '@wordpress/element';
import {
	ToolbarDropdownMenu,
	ToolbarGroup,
	Animate,
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
import { useBaseAI } from '@/shared/hooks/useBaseAi';
import { useSnackbar } from '@/shared/hooks/useSnackbar';
import { useCommandStore } from '@/apps/gutenberg-toolbar/stores/commandStore';
import type { BlockEditProps } from '@wordpress/blocks';

const withToolbarButton = createHigherOrderComponent(
	(BlockEdit : React.ComponentType<BlockEditProps<any>>) => {
		return (props : BlockEditProps<any>) => {
			const [showCommandBox, setShowCommandBox] = useState(false);
			const [commandBoxMode, setCommandBoxMode] = useState<'default' | 'image-edit'>('default');
			const { updateBlockAttributes } = useDispatch('core/block-editor') as any;
			const { createErrorSnackbar, createSuccessSnackbar } = useSnackbar();
			const { setBlockProcessing, processingBlocks } = useCommandStore();

			// Get processing state for this block
			const isProcessing = processingBlocks.has(props.clientId);

			// Wrapper function to manage block processing state
			const setIsProcessing = (processing: boolean) => {
				setBlockProcessing(props.clientId, processing);
			};

			// Initialize useBaseAI hook at the top level for audio transcription
			const { callAI } = useBaseAI({
				getSystemPrompt: () => 'You are a helpful assistant that transcribes audio messages. Provide only the transcription without any additional text.',
				getSiteContext: () => ({ selectedContexts: [] })
			});

			if (!props.isSelected) {
				return <BlockEdit {...props} />;
			}

		const isText = (props as any).name === 'core/paragraph' || (props as any).name === 'core/heading' || (props as any).name === 'core/quote' || (props as any).name === 'core/preformatted' || (props as any).name === 'core/verse' || (props as any).name === 'core/list-item';
		const isImage = (props as any).name === 'core/image' || (props as any).name === 'core/cover';
		const isCode = (props as any).name === 'core/code';
		const blockContent = props.attributes?.content || '';
		const imageUrl = props.attributes?.url;
		const imageId = props.attributes?.id;

			// Image edit execute function
			const handleImageEdit = async (command: string | MCPClientMessage) => {
				if (!imageUrl) return false;

				setIsProcessing(true);
				try {
					let editPrompt: string;

					// Check if this is an audio message that needs transcription
					if (typeof command !== 'string' && command.content && Array.isArray(command.content)) {
						const audioContent = command.content.find((item: any) => item.type === 'audio');

						if (audioContent) {
							// Transcribe audio using AI
							const defaultModel: AIModel = {
								id: 'suggerence-v1',
								provider: 'suggerence',
								providerName: 'Suggerence',
								name: 'Suggerence v1',
								date: new Date().toISOString(),
								capabilities: ['text-generation', 'audio-transcription']
							};

							const messages: MCPClientMessage[] = [{
								role: 'user',
								content: command.content,
								date: new Date().toISOString()
							}];

							const response = await callAI(messages, defaultModel, []);

							if (!response.content) {
								createErrorSnackbar(__('Failed to transcribe audio. Please try again.', 'suggerence'));
								return false;
							}

							editPrompt = response.content;
						} else {
							// Extract text from multimodal content (no audio)
							editPrompt = command.content
								.filter((item: any) => item.type === 'text')
								.map((item: any) => item.text)
								.join(' ');
						}
					} else {
						// Simple string command
						editPrompt = typeof command === 'string' ? command : String(command.content || '');
					}

					if (!editPrompt.trim()) {
						createErrorSnackbar(__('Please provide a valid edit command.', 'suggerence'));
						return false;
					}

					const result = await generateEditedImage(editPrompt, imageUrl);
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
				} finally {
					setIsProcessing(false);
				}
			};

		if(!isText && !isImage && !isCode) {
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
													isProcessing={isProcessing}
													setIsProcessing={setIsProcessing}
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

// HOC to add processing class and overlay to block wrapper
const withProcessingClass = createHigherOrderComponent(
	(BlockListBlock) => {
		return (props: any) => {
			const { processingBlocks } = useCommandStore();
			const isProcessing = processingBlocks.has(props.clientId);

			if (!isProcessing) {
				return <BlockListBlock {...props} />;
			}

			return (
				<div style={{ position: 'relative' }}>
					<BlockListBlock
						{...props}
						className={`${props.className || ''} suggerence-thinking`.trim()}
					/>
					<Animate type="loading">
						{({ className }) => (
							<div
								className={className}
								style={{
									position: 'absolute',
									inset: 0,
									background: 'rgba(255, 255, 255, 0.8)',
									backdropFilter: 'blur(2px)',
									borderRadius: '8px',
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
									pointerEvents: 'none',
									zIndex: 10,
								}}
							>
								<div
									style={{
										display: 'flex',
										alignItems: 'center',
										gap: '8px',
										padding: '8px 16px',
										background: 'rgba(210, 33, 120, 0.1)',
										borderRadius: '20px',
										border: '1px solid rgba(210, 33, 120, 0.2)',
									}}
								>
									<div
										style={{
											width: '16px',
											height: '16px',
											borderRadius: '50%',
											border: '2px solid rgba(210, 33, 120, 0.3)',
											borderTopColor: '#d22178',
											animation: 'spin 0.8s linear infinite',
										}}
									/>
									<span style={{
										fontSize: '13px',
										fontWeight: 500,
										color: '#d22178'
									}}>
										{__('AI is processing...', 'suggerence')}
									</span>
								</div>
							</div>
						)}
					</Animate>
				</div>
			);
		};
	},
	'withProcessingClass'
);

export const BlockToolbarIntegration = () => {
	useEffect(() => {
		const editHookName = 'suggerence/add-toolbar-button';
		const listBlockHookName = 'suggerence/add-processing-class';

		addFilter('editor.BlockEdit', editHookName, withToolbarButton, 20);
		addFilter('editor.BlockListBlock', listBlockHookName, withProcessingClass, 20);

		return () => {
			removeFilter('editor.BlockEdit', editHookName);
			removeFilter('editor.BlockListBlock', listBlockHookName);
		};
	}, []);

	return null;
};
