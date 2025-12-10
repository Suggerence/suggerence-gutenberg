import domReady from '@wordpress/dom-ready';
import { createRoot } from '@wordpress/element';
import { SuggerenceApiKeySettings } from '@/apps/api-key-settings';

domReady(() => {
    const container = document.getElementById('suggerence-api-key-settings');
    if (!container) {
        return;
    }

    const root = createRoot(container);
    root.render(<SuggerenceApiKeySettings />);
});
