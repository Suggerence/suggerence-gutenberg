import {
	MenuGroup,
	MenuItem,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useDispatch } from '@wordpress/data';
import { generateEditedImage } from '@/shared/mcps/tools/image-generation';
import { useBaseAI } from '@/shared/hooks/useBaseAi';
import { useSnackbar } from '@/shared/hooks/useSnackbar';

interface QuickActionsImageProps {
	imageUrl?: string;
	imageId?: number;
	clientId: string;
	onClose: () => void;
	onShowEditCommand: () => void;
	isProcessing: boolean;
	setIsProcessing: (isProcessing: boolean) => void;
}

export const QuickActionsImage = ({
	imageUrl,
	imageId,
	clientId,
	onClose,
	onShowEditCommand,
	isProcessing,
	setIsProcessing
}: QuickActionsImageProps) => {
	const { updateBlockAttributes } = useDispatch('core/block-editor') as any;
	const { createErrorSnackbar, createSuccessSnackbar } = useSnackbar();

	const handleGenerateAltText = async () => {
		if (!imageUrl) return;

		setIsProcessing(true);
		try {

			const { callAI } = useBaseAI({
				getSystemPrompt: () => 'You are a helpful AI assistant that generates concise, descriptive alt text for images to improve web accessibility.',
				getSiteContext: () => ({
					selectedContexts: [{
						id: imageId ? `image-${imageId}` : 'image-for-alt',
						type: 'image',
						label: 'Current Image',
						data: {
							url: imageUrl
						}
					}]
				})
			});

			const defaultModel: AIModel = {
				id: 'suggerence-v1',
				provider: 'suggerence',
				providerName: 'Suggerence',
				name: 'Suggerence v1',
				date: new Date().toISOString(),
				capabilities: ['text-generation']
			};

			const messages: MCPClientMessage[] = [
				{
					role: 'user' as const,
					content: 'Generate a concise, descriptive alt text for this image. Return ONLY the alt text, without any additional explanation or formatting.',
					date: new Date().toISOString()
				}
			];

			const response = await callAI(messages, defaultModel, []);

			if (response.content) {
				// Clean up the response - remove quotes if present
				const altText = response.content.replace(/^["']|["']$/g, '').trim();

				updateBlockAttributes(clientId, {
					alt: altText
				});

				createSuccessSnackbar(__('Alt text generated successfully!', 'suggerence'));
				onClose();
			} else {
				createErrorSnackbar(__('Failed to generate alt text. Please try again.', 'suggerence'));
			}
		} catch (error) {
			createErrorSnackbar(__('An error occurred while generating alt text.', 'suggerence'));
			console.error('Error generating alt text:', error);
		} finally {
			setIsProcessing(false);
		}
	};

	const handleRemoveBackground = async () => {
		if (!imageUrl) return;

		setIsProcessing(true);
		try {
			const result = await generateEditedImage(
				'Remove the background from this image, making it transparent',
				imageUrl
			);

			// Parse the response
			const response = JSON.parse(result.content[0].text);

			if (response.success && response.data) {
				// Update the block with the new image
				updateBlockAttributes(clientId, {
					id: response.data.image_id,
					url: response.data.image_url,
					alt: response.data.alt_text
				});

				createSuccessSnackbar(__('Background removed successfully!', 'suggerence'));
				onClose();
			} else {
				createErrorSnackbar(__('Failed to remove background. Please try again.', 'suggerence'));
			}
		} catch (error) {
			createErrorSnackbar(__('An error occurred while removing background.', 'suggerence'));
			console.error('Error removing background:', error);
		} finally {
			setIsProcessing(false);
		}
	};

	return (
		<MenuGroup label={__('Image Actions', 'suggerence')}>
			<MenuItem
				onClick={onShowEditCommand}
				disabled={!imageUrl}
			>
				{__('Edit Image with AI', 'suggerence')}
			</MenuItem>

			<MenuItem
				onClick={handleGenerateAltText}
				disabled={isProcessing || !imageUrl}
			>
				{__('Generate ALT Text', 'suggerence')}
			</MenuItem>

			{/* <MenuItem
				onClick={handleRemoveBackground}
				disabled={isProcessing || !imageUrl}
			>
				{__('Remove Background', 'suggerence')}
			</MenuItem> */}
		</MenuGroup>
	);
};
