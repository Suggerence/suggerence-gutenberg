
import { registerPlugin } from '@wordpress/plugins';
import { SuggerenceIcon } from '@/components/SuggerenceIcon';
import domReady from '@wordpress/dom-ready';
import { select } from '@wordpress/data';
import { createRoot } from '@wordpress/element';

import { GutenbergAssistant } from '@/apps/gutenberg-assistant';
import { GutenbergToolbar } from '@/apps/gutenberg-toolbar';

registerPlugin('suggerence-gutenberg-assistant', {
    render: GutenbergAssistant,
    icon: <SuggerenceIcon />,
});

domReady(() => {
    // Only load in the block editor
    if (select && select('core/edit-post')) {
        // Create a container for the gutenberg toolbar app
        const container = document.createElement('div');
        container.id = 'suggerence-gutenberg-toolbar';
        container.style.position = 'fixed';
        container.style.zIndex = '999999';
        container.style.pointerEvents = 'none'; // Allow clicks to pass through when not active
        document.body.appendChild(container);

        const root = createRoot(container);
        root.render(<GutenbergToolbar />);
    }
});