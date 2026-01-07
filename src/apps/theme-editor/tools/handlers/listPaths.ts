import { NAVIGATION_PATHS } from '../../constants/navigation';

export default async () => {
    // Extract the 'p' query parameter from the current URL
    const urlParams = new URLSearchParams(window.location.search);
    const encodedPath = urlParams.get('p');
    const encodedSection = urlParams.get('section');
    const encodedActiveView = urlParams.get('activeView');
    const encodedCategoryId = urlParams.get('categoryId');
    const encodedPostId = urlParams.get('postId');

    // Decode the URL-encoded path (e.g., %2Fnavigation -> /navigation)
    const currentPath = encodedPath ? decodeURIComponent(encodedPath).replace('/', '') : '';
    const currentSection = encodedSection ? decodeURIComponent(encodedSection).replace('/', '') : '';
    const currentActiveView = encodedActiveView ? decodeURIComponent(encodedActiveView).replace('/', '') : '';
    const currentCategoryId = encodedCategoryId ? decodeURIComponent(encodedCategoryId).replace('/', '') : '';
    const currentPostId = encodedPostId ? decodeURIComponent(encodedPostId).replace('/', '') : '';

    // Resolve the available paths based on the current path
    const currentPathInfo = {
        path: currentPath,
        section: currentSection,
        activeView: currentActiveView,
        categoryId: currentCategoryId,
        postId: currentPostId,
    };
    const availablePaths = resolveAvailablePaths(currentPathInfo);

    return {
        currentPath: getAbsolutePath(currentPathInfo),
        availablePaths
    };
}

export function getAbsolutePath(currentPathInfo: Record<string, string>): string
{
    const rootPath = currentPathInfo.path.split('/')[0];

    switch (rootPath) {
        case 'navigation':
            return 'navigation';

        case 'styles':
            return `styles/${currentPathInfo.section ?? ''}`;

        case 'page':
            return `page/${currentPathInfo.postId ?? currentPathInfo.categoryId ?? ''}`;

        case 'template':
            return 'template';

        case 'pattern':
            return `pattern/${currentPathInfo.categoryId ?? ''}`;

        default:
            return rootPath;
    }
}

export function getFinalPath(suggerencePath: string): string
{
    const [rootPath, ...commonParts] = suggerencePath.split('/');

    const url = new URL(window.location.href);
    url.searchParams.set('p', rootPath);

    switch (rootPath) {
        case 'styles':
            url.searchParams.set('section', `/${commonParts.join('/')}`);
            break;

        case 'page':
            if (!!parseInt(commonParts[0])) {
                url.searchParams.set('postId', commonParts[0]);
            }
            else {
                url.searchParams.set('layout', 'list');
                url.searchParams.set('activeView', commonParts[0]);
            }
            break;

        case 'pattern':
            url.searchParams.set('categoryId', commonParts[0]);
            break;
    }

    return url.toString();
}

function resolveAvailablePaths(currentPathInfo: Record<string, string>): string[]
{
    const absolutePath = getAbsolutePath(currentPathInfo);
    
    // Split the absolute path into segments
    const pathSegments = absolutePath.split('/').filter(segment => segment !== '');
    
    // Navigate through NAVIGATION_PATHS to find the current location
    let currentLevel: Record<string, any> = NAVIGATION_PATHS;
    
    for (const segment of pathSegments) {
        if (currentLevel[segment]) {
            currentLevel = currentLevel[segment];
        } else {
            // Path segment not found, return empty array or just '..' if not at root
            return pathSegments.length > 1 ? ['..'] : [];
        }
    }
    
    // Get available paths at current level
    const availablePaths: string[] = Object.keys(currentLevel);
    
    // If not at root level, add '..' to go up one level
    if (pathSegments.length > 0) {
        availablePaths.unshift('..');
    }
    
    return availablePaths;
}