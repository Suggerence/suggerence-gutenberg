import { getStyle, mergeGlobalStyles } from '@/lib/global-styles-engine';
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
    // TODO: Add child theme check

    const userValue = getStyle(userConfiguredStyles || {}, finalPath, block, false);
    const themeValue = getStyle(themeDefaultStyles || {}, finalPath, block, false);

    let origin: 'theme' | 'user' | undefined;
    if (userValue !== undefined) {
        origin = 'user';
    } else if (themeValue !== undefined) {
        origin = 'theme';
    }

    const mergedGlobalStyles = mergeGlobalStyles(themeDefaultStyles || {}, userConfiguredStyles || {});
    const value = getStyle(mergedGlobalStyles, finalPath, block, shouldResolve);

    return {
        value,
        origin,
    }
}