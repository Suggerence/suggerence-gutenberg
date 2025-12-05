import { useDispatch } from '@wordpress/data';
import { store as noticesStore } from '@wordpress/notices';

type NoticeType = 'success' | 'error' | 'warning' | 'info';

interface NoticeOptions {
	/**
	 * Whether the notice can be dismissed by the user
	 * @default true
	 */
	isDismissible?: boolean;
	/**
	 * Type of notice
	 * @default 'info'
	 */
	type?: NoticeType;
	/**
	 * Whether to speak the notice for accessibility
	 * @default true
	 */
	speak?: boolean;
	/**
	 * Context for the notice (e.g., 'global')
	 * @default 'global'
	 */
	context?: string;
}

/**
 * Hook to create Gutenberg toast notifications
 *
 * @example
 * ```tsx
 * const { createNotice, createErrorNotice, createSuccessNotice } = useNotice();
 *
 * // Create a custom notice
 * createNotice('Something happened', { type: 'warning' });
 *
 * // Create an error notice
 * createErrorNotice('An error occurred');
 *
 * // Create a success notice
 * createSuccessNotice('Operation completed!');
 * ```
 */
export const useNotice = () => {
	const { createNotice: createNoticeAction } = useDispatch(noticesStore) as any;

	/**
	 * Create a notice/toast notification
	 *
	 * @param message - The message to display
	 * @param options - Configuration options for the notice
	 */
	const createNotice = (message: string, options: NoticeOptions = {}) => {
		const {
			isDismissible = true,
			type = 'info',
			speak = true,
			context = 'global',
		} = options;

		createNoticeAction(type, message, {
			isDismissible,
			speak,
			context,
		});
	};

	/**
	 * Create an error notice
	 *
	 * @param message - The error message to display
	 * @param isDismissible - Whether the notice can be dismissed
	 */
	const createErrorNotice = (message: string, isDismissible = true) => {
		createNotice(message, { type: 'error', isDismissible });
	};

	/**
	 * Create a success notice
	 *
	 * @param message - The success message to display
	 * @param isDismissible - Whether the notice can be dismissed
	 */
	const createSuccessNotice = (message: string, isDismissible = true) => {
		createNotice(message, { type: 'success', isDismissible });
	};

	/**
	 * Create a warning notice
	 *
	 * @param message - The warning message to display
	 * @param isDismissible - Whether the notice can be dismissed
	 */
	const createWarningNotice = (message: string, isDismissible = true) => {
		createNotice(message, { type: 'warning', isDismissible });
	};

	/**
	 * Create an info notice
	 *
	 * @param message - The info message to display
	 * @param isDismissible - Whether the notice can be dismissed
	 */
	const createInfoNotice = (message: string, isDismissible = true) => {
		createNotice(message, { type: 'info', isDismissible });
	};

	return {
		createNotice,
		createErrorNotice,
		createSuccessNotice,
		createWarningNotice,
		createInfoNotice,
	};
};
