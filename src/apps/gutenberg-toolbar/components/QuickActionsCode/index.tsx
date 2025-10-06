import { useState } from '@wordpress/element';
import {
	MenuGroup,
	MenuItem,
	Dropdown,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { chevronRight } from '@wordpress/icons';
import { useDispatch } from '@wordpress/data';
import { useBaseAI } from '@/shared/hooks/useBaseAi';

const PROGRAMMING_LANGUAGES = [
	{ label: __('JavaScript', 'suggerence'), value: 'JavaScript' },
	{ label: __('TypeScript', 'suggerence'), value: 'TypeScript' },
	{ label: __('Python', 'suggerence'), value: 'Python' },
	{ label: __('Java', 'suggerence'), value: 'Java' },
	{ label: __('C', 'suggerence'), value: 'C' },
	{ label: __('C++', 'suggerence'), value: 'C++' },
	{ label: __('C#', 'suggerence'), value: 'C#' },
	{ label: __('Go', 'suggerence'), value: 'Go' },
	{ label: __('Rust', 'suggerence'), value: 'Rust' },
	{ label: __('PHP', 'suggerence'), value: 'PHP' },
	{ label: __('Ruby', 'suggerence'), value: 'Ruby' },
	{ label: __('Swift', 'suggerence'), value: 'Swift' },
	{ label: __('Kotlin', 'suggerence'), value: 'Kotlin' },
	{ label: __('Dart', 'suggerence'), value: 'Dart' },
	{ label: __('R', 'suggerence'), value: 'R' },
	{ label: __('Scala', 'suggerence'), value: 'Scala' },
	{ label: __('Perl', 'suggerence'), value: 'Perl' },
	{ label: __('Haskell', 'suggerence'), value: 'Haskell' },
	{ label: __('Elixir', 'suggerence'), value: 'Elixir' },
	{ label: __('Clojure', 'suggerence'), value: 'Clojure' },
	{ label: __('F#', 'suggerence'), value: 'F#' },
	{ label: __('Lua', 'suggerence'), value: 'Lua' },
	{ label: __('Shell/Bash', 'suggerence'), value: 'Shell/Bash' },
	{ label: __('PowerShell', 'suggerence'), value: 'PowerShell' },
	{ label: __('SQL', 'suggerence'), value: 'SQL' },
	{ label: __('HTML', 'suggerence'), value: 'HTML' },
	{ label: __('CSS', 'suggerence'), value: 'CSS' },
	{ label: __('SCSS', 'suggerence'), value: 'SCSS' },
	{ label: __('JSON', 'suggerence'), value: 'JSON' },
	{ label: __('YAML', 'suggerence'), value: 'YAML' },
	{ label: __('XML', 'suggerence'), value: 'XML' },
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

interface QuickActionsCodeProps {
	blockContent: string;
	clientId: string;
	onClose: () => void;
	isProcessing: boolean;
	setIsProcessing: (value: boolean) => void;
}

export const QuickActionsCode = ({
	blockContent,
	clientId,
	onClose,
	isProcessing,
	setIsProcessing
}: QuickActionsCodeProps) => {
	const { updateBlockAttributes } = useDispatch('core/block-editor') as any;

	const { callAI } = useBaseAI({
		getSystemPrompt: () => 'You are a helpful AI assistant that translates code between programming languages. Return ONLY the translated code without any explanations, markdown formatting, or code block markers. Preserve the logic and structure of the original code.',
		getSiteContext: () => ({})
	});

	const handleQuickAction = async (action: string, parameter?: string) => {
		if (!blockContent) return;

		setIsProcessing(true);
		try {
			let prompt = '';
			switch (action) {
				case 'translate':
					prompt = `Translate this code to ${parameter}. Return only the translated code without any explanations or markdown formatting:\n\n${blockContent}`;
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
			}
		} catch (error) {
			console.error('Error processing quick action:', error);
		} finally {
			setIsProcessing(false);
		}
	};

	return (
		<MenuGroup label={__('Quick Actions', 'suggerence')}>
			<SubMenuItem
				label={__('Translate Code', 'suggerence')}
				items={PROGRAMMING_LANGUAGES}
				onSelect={(value) => {
					handleQuickAction('translate', value);
					onClose();
				}}
				disabled={isProcessing || !blockContent}
			/>
		</MenuGroup>
	);
};

