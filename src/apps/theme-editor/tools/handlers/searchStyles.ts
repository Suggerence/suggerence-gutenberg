import Fuse from 'fuse.js';
import listStyles from './listStyles';
import readStyle from './readStyle';

export default async (data: { query: string }) => {
    const { query } = data;

    const allPaths = await listStyles();
    const fuse = new Fuse(allPaths);
    
    // First, try searching with the full query
    let results = fuse.search(query);
    
    // If no results found, try searching with each word individually
    if (results.length === 0 && query.trim().includes(' ')) {
        const words = query.trim().split(/\s+/).filter(word => word.length > 0);
        const allResults: typeof results = [];
        
        // Search each word individually
        for (const word of words) {
            const wordResults = fuse.search(word);
            allResults.push(...wordResults);
        }
        
        // Remove duplicates based on path (result.item)
        const uniqueResults = new Map<string, typeof results[0]>();
        for (const result of allResults) {
            if (!uniqueResults.has(result.item)) {
                uniqueResults.set(result.item, result);
            }
        }
        
        results = Array.from(uniqueResults.values());
    }

    return await Promise.all(results.map(async (result) => ({
        path: result.item,
        value: (await readStyle({ path: result.item })).value,
    })));
}