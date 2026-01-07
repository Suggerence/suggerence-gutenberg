import { select, dispatch } from '@wordpress/data';

export const WPCore = () => {
    return select('core');
}

export const getThemeDefaultStyles = () => {
    const core = WPCore();
    return core.__experimentalGetCurrentThemeBaseGlobalStyles();
}

export const getUserConfiguredStyles = () => {
    const core = WPCore();
    const userConfiguredStylesId = core.__experimentalGetCurrentGlobalStylesId();
    return core.getEditedEntityRecord('root', 'globalStyles', userConfiguredStylesId);
}

function getAllPaths(obj: any, prefix: string = ''): string[] {
    let paths: string[] = [];
    if (obj === null || obj === undefined) {
        return paths;
    }
    if (typeof obj !== 'object') {
        paths.push(prefix.slice(0, -1)); // Remove trailing dot for leaf nodes
        return paths;
    }
    if (Array.isArray(obj)) {
        obj.forEach((item, index) => {
            paths = paths.concat(getAllPaths(item, `${prefix}${index}.`));
        });
    } else {
        Object.keys(obj).forEach(key => {
            paths = paths.concat(getAllPaths(obj[key], `${prefix}${key}.`));
        });
    }
    return paths;
}

export default async () => {
    const themeDefaultStyles = getThemeDefaultStyles();
    const userConfiguredStyles = getUserConfiguredStyles();

    const themePath = getAllPaths(themeDefaultStyles?.styles, 'styles.');

    const userPath = getAllPaths(userConfiguredStyles?.styles, 'styles.');

    const allPaths = [...new Set([...themePath, ...userPath])]
        .map(path => path.startsWith('styles.') ? path.slice(7) : path)
        .sort();

    return allPaths;
}