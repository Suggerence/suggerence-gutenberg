import { getAbsolutePath, getFinalPath } from './listPaths';
import { NAVIGATION_PATHS } from '../../constants/navigation';

interface NavigateInput {
    path: string;
}

/**
 * Validates if a path is valid according to NAVIGATION_PATHS structure.
 * Handles dynamic values (keys wrapped in curly braces like {page_id}).
 * @param path - The path to validate (e.g., 'styles/typography/text' or 'page/123')
 * @returns true if the path is valid, false otherwise
 */
function isValidPath(path: string): boolean {
    // Handle special cases
    if (path === '' || path === '..') {
        return true; // Empty path (root) and parent directory are always valid
    }

    // Split the path into segments
    const pathSegments = path.split('/').filter(segment => segment !== '');
    
    // Navigate through NAVIGATION_PATHS to validate the path
    let currentLevel: Record<string, any> = NAVIGATION_PATHS;
    
    for (let i = 0; i < pathSegments.length; i++) {
        const segment = pathSegments[i];
        const isLastSegment = i === pathSegments.length - 1;
        
        // Check if the segment exists as a direct key
        if (currentLevel[segment]) {
            const nextLevel = currentLevel[segment];
            // If this is not the last segment, ensure the current level has children
            if (!isLastSegment && Object.keys(nextLevel).length === 0) {
                return false; // Trying to navigate into a leaf node
            }
            currentLevel = nextLevel;
            continue;
        }
        
        // Check if there's a dynamic key (wrapped in {}) that matches
        const dynamicKey = Object.keys(currentLevel).find(key => 
            key.startsWith('{') && key.endsWith('}')
        );
        
        if (dynamicKey) {
            const nextLevel = currentLevel[dynamicKey];
            // If this is not the last segment, ensure the dynamic level has children
            if (!isLastSegment && Object.keys(nextLevel).length === 0) {
                return false; // Trying to navigate into a leaf node
            }
            // Dynamic value found - accept any segment value
            currentLevel = nextLevel;
            continue;
        }
        
        // Segment not found and no dynamic key available
        return false;
    }
    
    // All segments were validated successfully
    return true;
}

export default async (input: NavigateInput) => {
    const { path } = input;

    // Extract current path info from URL
    const urlParams = new URLSearchParams(window.location.search);
    const encodedPath = urlParams.get('p');
    const encodedSection = urlParams.get('section');
    const encodedActiveView = urlParams.get('activeView');
    const encodedCategoryId = urlParams.get('categoryId');
    const encodedPostId = urlParams.get('postId');

    const currentPath = encodedPath ? decodeURIComponent(encodedPath).replace('/', '') : '';
    const currentSection = encodedSection ? decodeURIComponent(encodedSection).replace('/', '') : '';
    const currentActiveView = encodedActiveView ? decodeURIComponent(encodedActiveView).replace('/', '') : '';
    const currentCategoryId = encodedCategoryId ? decodeURIComponent(encodedCategoryId).replace('/', '') : '';
    const currentPostId = encodedPostId ? decodeURIComponent(encodedPostId).replace('/', '') : '';

    const currentPathInfo = {
        path: currentPath,
        section: currentSection,
        activeView: currentActiveView,
        categoryId: currentCategoryId,
        postId: currentPostId,
    };

    // Get the absolute current path
    const absoluteCurrentPath = getAbsolutePath(currentPathInfo);

    // Handle relative path navigation
    let targetPath: string;
    if (path === '..') {
        // Go up one level
        const pathSegments = absoluteCurrentPath.split('/').filter(segment => segment !== '');
        pathSegments.pop();
        targetPath = pathSegments.join('/');
    } else if (path.startsWith('/')) {
        // Absolute path
        targetPath = path.replace(/^\//, '');
    } else {
        // Relative path - append to current path
        const pathSegments = absoluteCurrentPath.split('/').filter(segment => segment !== '');
        pathSegments.push(path);
        targetPath = pathSegments.join('/');
    }

    // Validate the target path
    if (!isValidPath(targetPath)) {
        return {
            success: false,
            error: `Invalid path: "${targetPath}". The path does not exist in the navigation structure.`,
            navigatedTo: absoluteCurrentPath,
        };
    }

    // Construct the final URL and update it
    const finalUrl = getFinalPath(targetPath);
    const url = new URL(finalUrl);
    const newUrl = url.pathname + url.search + url.hash;
    
    // Update the URL without triggering a page reload
    window.history.pushState(null, '', newUrl);
        const popStateEvent = new PopStateEvent('popstate', { 
        state: null,
        bubbles: true,
        cancelable: true
    });
    window.dispatchEvent(popStateEvent);

    return {
        success: true,
        navigatedTo: targetPath,
    };
};
