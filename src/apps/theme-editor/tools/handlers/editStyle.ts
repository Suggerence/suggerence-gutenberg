import { generateGlobalStyles, mergeGlobalStyles } from '@/lib/global-styles-engine';
import apiFetch from '@wordpress/api-fetch';
import { THEME_EDITOR_API_NAMESPACE } from '../../constants/api';
import { GlobalStylesConfig } from '@/lib/global-styles-engine/types';
import { getThemeDefaultStyles } from './listStyles';

const addImportantToAllDeclarations = (css: string): string => {
    // Match `property: value;` but ignore already-important ones
    const DECLARATION_REGEX = /:(\s*[^;{}]+?)(\s*!important)?\s*;/g;

    return css.replace(DECLARATION_REGEX, (_match, value, important) => {
        if (important) return `:${value} !important;`;
        return `:${value.trim()} !important;`;
    });
};

export default async (data: { path: string, value: string, block?: string }): Promise<{ success: boolean; message: string }> =>
{
    const { path, value, block } = data;

    try {
        // Get the updated styles from the API response
        const updatedUserStyles: GlobalStylesConfig = await apiFetch({
            path: `${THEME_EDITOR_API_NAMESPACE}/styles`,
            method: 'POST',
            body: JSON.stringify({
                path,
                value,
                ...(block && { block })
            }),
            headers: { 'Content-Type': 'application/json' }
        }) || { styles: {}, settings: {} };
        
        // Get theme defaults and merge with user styles
        const themeDefaultStyles = getThemeDefaultStyles() || { styles: {}, settings: {} };
        const globalStyles = mergeGlobalStyles(themeDefaultStyles, updatedUserStyles);

        const [stylesheets] = generateGlobalStyles(globalStyles);
        // Extract and combine all CSS from stylesheets
        const newCss = stylesheets
            .map((sheet: any) => sheet.css || '')
            .filter((css: string) => css.trim().length > 0)
            .join('\n');

        const iframe = document.querySelector('iframe[name="editor-canvas"]') as HTMLIFrameElement | null;
        if (iframe && iframe.contentDocument) {
            const styleId = 'suggerence-style-update';
            let style = iframe.contentDocument.getElementById(styleId) as HTMLStyleElement | null;
            if (!style) {
                style = iframe.contentDocument.createElement('style');
                style.id = styleId;
                iframe.contentDocument.head.appendChild(style);
            }
            style.textContent = addImportantToAllDeclarations(newCss);
        }
        else {
            window.location.reload();
        }

        return {
            success: true,
            message: `Style updated successfully at path: ${path}${block ? ` for block: ${block}` : ''}`
        };
    } catch (error: any) {
        return {
            success: false,
            message: error?.message || `Failed to update style at path: ${path}`
        };
    }
}