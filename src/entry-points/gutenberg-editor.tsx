
import { registerPlugin } from '@wordpress/plugins';
import { SuggerenceIcon } from '@/components/SuggerenceIcon';
import domReady from '@wordpress/dom-ready';
import { select } from '@wordpress/data';
import { createRoot } from '@wordpress/element';

import { GutenbergAssistant } from '@/apps/gutenberg-assistant';
import { GutenbergToolbar } from '@/apps/gutenberg-toolbar';
import { GutenbergAutocomplete } from '@/apps/gutenberg-autocomplete';
// import { GutenbergSuggestions } from '@/apps/gutenberg-suggestions';

registerPlugin('suggerence-gutenberg-assistant', {
    render: GutenbergAssistant,
    icon: <SuggerenceIcon />,
});

domReady(() => {
    // Only load in the block editor
    if (select && select('core/edit-post')) {
        // Create a container for the gutenberg toolbar app
        const toolbarContainer = document.createElement('div');
        toolbarContainer.id = 'suggerence-gutenberg-toolbar';
        toolbarContainer.style.position = 'fixed';
        toolbarContainer.style.zIndex = '999999';
        toolbarContainer.style.pointerEvents = 'none'; // Allow clicks to pass through when not active
        document.body.appendChild(toolbarContainer);

        const toolbarRoot = createRoot(toolbarContainer);
        toolbarRoot.render(<GutenbergToolbar />);

        // Create a container for the autocomplete app
        const autocompleteContainer = document.createElement('div');
        autocompleteContainer.id = 'suggerence-gutenberg-autocomplete';
        autocompleteContainer.style.position = 'fixed';
        autocompleteContainer.style.zIndex = '999998';
        autocompleteContainer.style.pointerEvents = 'none';
        document.body.appendChild(autocompleteContainer);

        const autocompleteRoot = createRoot(autocompleteContainer);
        autocompleteRoot.render(<GutenbergAutocomplete />);

        // Create a container for the suggestions app
        // const suggestionsContainer = document.createElement('div');
        // suggestionsContainer.id = 'suggerence-gutenberg-suggestions';
        // suggestionsContainer.style.position = 'fixed';
        // suggestionsContainer.style.bottom = '20px';
        // suggestionsContainer.style.right = '20px';
        // suggestionsContainer.style.zIndex = '999998';
        // document.body.appendChild(suggestionsContainer);

        // const suggestionsRoot = createRoot(suggestionsContainer);
        // suggestionsRoot.render(<GutenbergSuggestions />);
    }
});