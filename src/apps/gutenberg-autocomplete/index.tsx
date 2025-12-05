import { useEffect } from '@wordpress/element';
import { registerAutocompleteFilter } from './components/BlockEditorWrapper';

export const GutenbergAutocomplete = () => {
    // Register the WordPress block filter on mount
    useEffect(() => {
        console.log('[GutenbergAutocomplete] Registering filter...');
        registerAutocompleteFilter();
    }, []);

    // This component doesn't render anything - it just registers the filter
    return null;
};
