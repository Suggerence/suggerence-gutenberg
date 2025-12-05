import { dispatch } from '@wordpress/data';
import { store as noticesStore } from '@wordpress/notices';

type SnackbarType = 'success' | 'error' | 'warning' | 'info';

/**
 * Hook to create snackbar toast notifications using WordPress notices API
 *
 * @example
 * ```tsx
 * const { createErrorSnackbar, createSuccessSnackbar } = useSnackbar();
 *
 * // Create an error snackbar
 * createErrorSnackbar('An error occurred');
 *
 * // Create a success snackbar
 * createSuccessSnackbar('Operation completed!');
 * ```
 */
export const useSnackbar = () => {
	/**
	 * Create a snackbar notification using WordPress notices
	 *
	 * @param message - The message to display
	 * @param noticeType - The type of snackbar
	 */
	const createSnackbar = (message: string, noticeType: SnackbarType = 'info') => {
		dispatch(noticesStore).createNotice(
			noticeType,
			message,
			{
				type: 'snackbar', // Makes it appear as a snackbar at the bottom
				isDismissible: true,
			}
		);
	};

	/**
	 * Create an error snackbar
	 *
	 * @param message - The error message to display
	 */
	const createErrorSnackbar = (message: string) => {
		createSnackbar(message, 'error');
	};

	/**
	 * Create a success snackbar
	 *
	 * @param message - The success message to display
	 */
	const createSuccessSnackbar = (message: string) => {
		createSnackbar(message, 'success');
	};

	/**
	 * Create a warning snackbar
	 *
	 * @param message - The warning message to display
	 */
	const createWarningSnackbar = (message: string) => {
		createSnackbar(message, 'warning');
	};

	/**
	 * Create an info snackbar
	 *
	 * @param message - The info message to display
	 */
	const createInfoSnackbar = (message: string) => {
		createSnackbar(message, 'info');
	};

	return {
		createSnackbar,
		createErrorSnackbar,
		createSuccessSnackbar,
		createWarningSnackbar,
		createInfoSnackbar,
	};
};
