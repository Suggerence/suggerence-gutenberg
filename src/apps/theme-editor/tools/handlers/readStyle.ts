import apiFetch from '@wordpress/api-fetch';
import { getStyle, mergeGlobalStyles, getValueFromVariable } from '@/lib/global-styles-engine';
import { THEME_EDITOR_API_NAMESPACE } from '../../constants/api';
import { getThemeDefaultStyles, getUserConfiguredStyles } from './listStyles';

export default async (data: { path: string, block?: string, var_value?: boolean }) => {
    const { path, block, var_value } = data;
    const shouldResolve = var_value !== false;

    let finalPath = path;
    if (path.startsWith('styles.')) {
        finalPath = path.replace('styles.', '');
    }

    const themeDefaultStyles = getThemeDefaultStyles();
    const userConfiguredStyles = getUserConfiguredStyles();
    const childThemeStyles = await apiFetch({
        path: `${THEME_EDITOR_API_NAMESPACE}/styles`,
        method: 'GET',
    }) || { styles: {}, settings: {} };

    // Get raw values from each source (without resolving variables)
    const userValue = getStyle(userConfiguredStyles || {}, finalPath, block, false);
    const themeValue = getStyle(themeDefaultStyles || {}, finalPath, block, false);
    const childThemeValue = getStyle(childThemeStyles || {}, finalPath, block, false);

    // Determine origin based on which source has the value
    let origin: 'ai' | 'theme' | 'user' = 'theme'; // Default to 'theme' if no value found
    let rawValue: any;
    if (userValue !== undefined) {
        origin = 'user';
        rawValue = userValue;
    } else if (themeValue !== undefined) {
        origin = 'theme';
        rawValue = themeValue;
    } else if (childThemeValue !== undefined) {
        origin = 'ai';
        rawValue = childThemeValue;
    } else {
        rawValue = undefined;
    }
    
    // If we need to resolve variables, merge styles and resolve the rawValue we already found
    // Otherwise, use the raw value directly
    let value: any;
    if (shouldResolve && rawValue !== undefined) {
        // Merge styles to get the full config needed for variable resolution
        const mergedGlobalStyles = mergeGlobalStyles(themeDefaultStyles || {}, userConfiguredStyles || {});
        const finalGlobalStyles = mergeGlobalStyles(mergedGlobalStyles, childThemeStyles || {});
        
        // Resolve the rawValue directly using the merged config
        // This ensures we resolve the value we know exists, rather than trying to find it again
        value = getValueFromVariable(finalGlobalStyles, block, rawValue);
        
        // If resolution didn't work (returned the same variable or undefined), try getStyle as fallback
        if (value === rawValue || value === undefined) {
            const resolvedFromPath = getStyle(finalGlobalStyles, finalPath, block, true);
            if (resolvedFromPath !== undefined) {
                value = resolvedFromPath;
            } else {
                // If still undefined, use raw value
                value = rawValue;
            }
        }
    } else {
        // Use the raw value directly (without resolving variables)
        value = rawValue;
    }

    // Ensure value is always a string (convert undefined/null to empty string, or stringify objects)
    let stringValue: string;
    if (value === undefined || value === null) {
        stringValue = '';
    } else if (typeof value === 'string') {
        stringValue = value;
    } else {
        // If value is an object or other type, stringify it
        stringValue = JSON.stringify(value);
    }

    return {
        value: stringValue,
        origin,
    }
}