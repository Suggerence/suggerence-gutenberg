import apiFetch from '@wordpress/api-fetch';
import { getStyle, mergeGlobalStyles } from '@/lib/global-styles-engine';
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

    const userValue = getStyle(userConfiguredStyles || {}, finalPath, block, false);
    const themeValue = getStyle(themeDefaultStyles || {}, finalPath, block, false);
    const childThemeValue = getStyle(childThemeStyles || {}, finalPath, block, false);

    let origin: 'ai' | 'theme' | 'user' | undefined;
    if (userValue !== undefined) {
        origin = 'user';
    } else if (themeValue !== undefined) {
        origin = 'theme';
    } else if (childThemeValue !== undefined) {
        origin = 'ai';
    }

    const mergedGlobalStyles = mergeGlobalStyles(themeDefaultStyles || {}, userConfiguredStyles || {});
    const finalGlobalStyles = mergeGlobalStyles(mergedGlobalStyles, childThemeStyles || {});
    const value = getStyle(finalGlobalStyles, finalPath, block, shouldResolve);

    return {
        value,
        origin,
    }
}