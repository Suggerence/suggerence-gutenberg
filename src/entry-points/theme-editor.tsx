import { select } from '@wordpress/data';
import domReady from '@wordpress/dom-ready';
import { createRoot } from '@wordpress/element';

import { ThemeEditor } from '@/apps/theme-editor';

domReady(() => 
{
    console.log('theme-editor');
    // Only load in the site editor
    if (!select || !select('core/edit-site')) {
        return;
    }

    // Create a container for the theme editor app
    const themeEditorContainer = document.createElement('div');
    themeEditorContainer.id = 'suggerence-theme-editor';
    themeEditorContainer.style.position = 'fixed';
    themeEditorContainer.style.zIndex = '999999';
    themeEditorContainer.style.pointerEvents = 'none'; // Allow clicks to pass through when not active
    themeEditorContainer.style.bottom = '2rem';
    themeEditorContainer.style.right = '4rem';
    document.body.appendChild(themeEditorContainer);

    const themeEditorRoot = createRoot(themeEditorContainer);
    themeEditorRoot.render(<ThemeEditor />);
});