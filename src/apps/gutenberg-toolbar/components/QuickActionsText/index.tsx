import {
	MenuGroup,
	MenuItem,
	Dropdown,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { chevronRight } from '@wordpress/icons';
import { useDispatch } from '@wordpress/data';
import { useBaseAI } from '@/shared/hooks/useBaseAi';
import { useSnackbar } from '@/shared/hooks/useSnackbar';

const TONES = [
	{ label: __('Professional', 'suggerence'), value: 'professional' },
	{ label: __('Casual', 'suggerence'), value: 'casual' },
	{ label: __('Friendly', 'suggerence'), value: 'friendly' },
	{ label: __('Formal', 'suggerence'), value: 'formal' },
	{ label: __('Persuasive', 'suggerence'), value: 'persuasive' },
];

const LANGUAGES = [
	{ label: __('Afrikaans', 'suggerence'), value: 'Afrikaans' },
	{ label: __('Albanian', 'suggerence'), value: 'Albanian' },
	{ label: __('Arabic', 'suggerence'), value: 'Arabic' },
	{ label: __('Armenian', 'suggerence'), value: 'Armenian' },
	{ label: __('Azerbaijani', 'suggerence'), value: 'Azerbaijani' },
	{ label: __('Basque', 'suggerence'), value: 'Basque' },
	{ label: __('Belarusian', 'suggerence'), value: 'Belarusian' },
	{ label: __('Bengali', 'suggerence'), value: 'Bengali' },
	{ label: __('Bosnian', 'suggerence'), value: 'Bosnian' },
	{ label: __('Bulgarian', 'suggerence'), value: 'Bulgarian' },
	{ label: __('Catalan', 'suggerence'), value: 'Catalan' },
	{ label: __('Chinese', 'suggerence'), value: 'Chinese' },
	{ label: __('Croatian', 'suggerence'), value: 'Croatian' },
	{ label: __('Czech', 'suggerence'), value: 'Czech' },
	{ label: __('Danish', 'suggerence'), value: 'Danish' },
	{ label: __('Dutch', 'suggerence'), value: 'Dutch' },
	{ label: __('English', 'suggerence'), value: 'English' },
	{ label: __('Estonian', 'suggerence'), value: 'Estonian' },
	{ label: __('Finnish', 'suggerence'), value: 'Finnish' },
	{ label: __('French', 'suggerence'), value: 'French' },
	{ label: __('Galician', 'suggerence'), value: 'Galician' },
	{ label: __('Georgian', 'suggerence'), value: 'Georgian' },
	{ label: __('German', 'suggerence'), value: 'German' },
	{ label: __('Greek', 'suggerence'), value: 'Greek' },
	{ label: __('Gujarati', 'suggerence'), value: 'Gujarati' },
	{ label: __('Hebrew', 'suggerence'), value: 'Hebrew' },
	{ label: __('Hindi', 'suggerence'), value: 'Hindi' },
	{ label: __('Hungarian', 'suggerence'), value: 'Hungarian' },
	{ label: __('Icelandic', 'suggerence'), value: 'Icelandic' },
	{ label: __('Indonesian', 'suggerence'), value: 'Indonesian' },
	{ label: __('Irish', 'suggerence'), value: 'Irish' },
	{ label: __('Italian', 'suggerence'), value: 'Italian' },
	{ label: __('Japanese', 'suggerence'), value: 'Japanese' },
	{ label: __('Kannada', 'suggerence'), value: 'Kannada' },
	{ label: __('Kazakh', 'suggerence'), value: 'Kazakh' },
	{ label: __('Khmer', 'suggerence'), value: 'Khmer' },
	{ label: __('Korean', 'suggerence'), value: 'Korean' },
	{ label: __('Kurdish', 'suggerence'), value: 'Kurdish' },
	{ label: __('Lao', 'suggerence'), value: 'Lao' },
	{ label: __('Latvian', 'suggerence'), value: 'Latvian' },
	{ label: __('Lithuanian', 'suggerence'), value: 'Lithuanian' },
	{ label: __('Macedonian', 'suggerence'), value: 'Macedonian' },
	{ label: __('Malay', 'suggerence'), value: 'Malay' },
	{ label: __('Malayalam', 'suggerence'), value: 'Malayalam' },
	{ label: __('Marathi', 'suggerence'), value: 'Marathi' },
	{ label: __('Mongolian', 'suggerence'), value: 'Mongolian' },
	{ label: __('Nepali', 'suggerence'), value: 'Nepali' },
	{ label: __('Norwegian', 'suggerence'), value: 'Norwegian' },
	{ label: __('Pashto', 'suggerence'), value: 'Pashto' },
	{ label: __('Persian', 'suggerence'), value: 'Persian' },
	{ label: __('Polish', 'suggerence'), value: 'Polish' },
	{ label: __('Portuguese', 'suggerence'), value: 'Portuguese' },
	{ label: __('Punjabi', 'suggerence'), value: 'Punjabi' },
	{ label: __('Romanian', 'suggerence'), value: 'Romanian' },
	{ label: __('Russian', 'suggerence'), value: 'Russian' },
	{ label: __('Serbian', 'suggerence'), value: 'Serbian' },
	{ label: __('Sindhi', 'suggerence'), value: 'Sindhi' },
	{ label: __('Sinhala', 'suggerence'), value: 'Sinhala' },
	{ label: __('Slovak', 'suggerence'), value: 'Slovak' },
	{ label: __('Slovenian', 'suggerence'), value: 'Slovenian' },
	{ label: __('Somali', 'suggerence'), value: 'Somali' },
	{ label: __('Spanish', 'suggerence'), value: 'Spanish' },
	{ label: __('Swahili', 'suggerence'), value: 'Swahili' },
	{ label: __('Swedish', 'suggerence'), value: 'Swedish' },
	{ label: __('Tagalog', 'suggerence'), value: 'Tagalog' },
	{ label: __('Tajik', 'suggerence'), value: 'Tajik' },
	{ label: __('Tamil', 'suggerence'), value: 'Tamil' },
	{ label: __('Tatar', 'suggerence'), value: 'Tatar' },
	{ label: __('Telugu', 'suggerence'), value: 'Telugu' },
	{ label: __('Thai', 'suggerence'), value: 'Thai' },
	{ label: __('Turkish', 'suggerence'), value: 'Turkish' },
	{ label: __('Ukrainian', 'suggerence'), value: 'Ukrainian' },
	{ label: __('Urdu', 'suggerence'), value: 'Urdu' },
	{ label: __('Uzbek', 'suggerence'), value: 'Uzbek' },
	{ label: __('Vietnamese', 'suggerence'), value: 'Vietnamese' },
	{ label: __('Welsh', 'suggerence'), value: 'Welsh' },
];

const SubMenuItem = ({ label, items, onSelect, disabled }: {
	label: string;
	items: Array<{ label: string; value: string }>;
	onSelect: (value: string) => void;
	disabled: boolean;
}) => {
	return (
		<Dropdown
			popoverProps={{ placement: 'right-start' }}
			renderToggle={({ isOpen, onToggle }) => (
				<MenuItem
					onClick={onToggle}
					icon={chevronRight}
					iconPosition="right"
					disabled={disabled}
					aria-expanded={isOpen}
				>
					{label}
				</MenuItem>
			)}
			renderContent={({ onClose }) => (
				<MenuGroup>
					{items.map((item) => (
						<MenuItem
							key={item.value}
							onClick={() => {
								onSelect(item.value);
								onClose();
							}}
							disabled={disabled}
						>
							{item.label}
						</MenuItem>
					))}
				</MenuGroup>
			)}
		/>
	);
};

interface QuickActionsTextProps {
	blockContent: string;
	clientId: string;
	onClose: () => void;
	isProcessing: boolean;
	setIsProcessing: (value: boolean) => void;
}

export const QuickActionsText = ({
	blockContent,
	clientId,
	onClose,
	isProcessing,
	setIsProcessing
}: QuickActionsTextProps) => {
	const { updateBlockAttributes } = useDispatch('core/block-editor') as any;
	const { createErrorSnackbar, createSuccessSnackbar } = useSnackbar();

	const { callAI } = useBaseAI({
		getSystemPrompt: () => 'You are a helpful AI assistant that modifies text content based on user requests. Return ONLY the modified text without any explanations or additional formatting.',
		getSiteContext: () => ({})
	});

	const handleQuickAction = async (action: string, parameter?: string) => {
		if (!blockContent) return;

		setIsProcessing(true);
		try {
			let prompt = '';
			switch (action) {
				case 'summarize':
					prompt = `Summarize this text concisely:\n\n${blockContent}`;
					break;
				case 'tone':
					prompt = `Change the tone of this text to ${parameter}:\n\n${blockContent}`;
					break;
				case 'translate':
					prompt = `Translate this text to ${parameter}:\n\n${blockContent}`;
					break;
			}

			const defaultModel: AIModel = {
				id: 'suggerence-v1',
				provider: 'suggerence',
				providerName: 'Suggerence',
				name: 'Suggerence v1',
				date: new Date().toISOString(),
				capabilities: ['text-generation']
			};

			const messages = [
				{
					role: 'user' as const,
					content: prompt,
					date: new Date().toISOString()
				}
			];

			const response = await callAI(messages, defaultModel, []);

			if (response.content) {
				updateBlockAttributes(clientId, {
					content: response.content
				});

				// Show success message based on action
				let successMessage = '';
				switch (action) {
					case 'summarize':
						successMessage = __('Text summarized successfully!', 'suggerence');
						break;
					case 'tone':
						successMessage = __('Tone changed successfully!', 'suggerence');
						break;
					case 'translate':
						successMessage = __('Text translated successfully!', 'suggerence');
						break;
				}
				if (successMessage) {
					createSuccessSnackbar(successMessage);
				}
			} else {
				createErrorSnackbar(__('Failed to process text. Please try again.', 'suggerence'));
			}
		} catch (error) {
			createErrorSnackbar(__('An error occurred while processing text.', 'suggerence'));
			console.error('Error processing quick action:', error);
		} finally {
			setIsProcessing(false);
		}
	};

	return (
		<MenuGroup label={__('Quick Actions', 'suggerence')}>
			<MenuItem
				onClick={() => {
					handleQuickAction('summarize');
					onClose();
				}}
				disabled={isProcessing || !blockContent}
			>
				{__('Summarize', 'suggerence')}
			</MenuItem>

			<SubMenuItem
				label={__('Change Tone', 'suggerence')}
				items={TONES}
				onSelect={(value) => {
					handleQuickAction('tone', value);
					onClose();
				}}
				disabled={isProcessing || !blockContent}
			/>

			<SubMenuItem
				label={__('Translate', 'suggerence')}
				items={LANGUAGES}
				onSelect={(value) => {
					handleQuickAction('translate', value);
					onClose();
				}}
				disabled={isProcessing || !blockContent}
			/>
		</MenuGroup>
	);
};
