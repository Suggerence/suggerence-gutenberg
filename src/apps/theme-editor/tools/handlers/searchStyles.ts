import Fuse from 'fuse.js';
import listStyles from './listStyles';
import readStyle from './readStyle';

export default async (data: { query: string }) => {
    const { query } = data;

    const allPaths = await listStyles();

    const fuse = new Fuse(allPaths);
    const results = fuse.search(query);

    return await Promise.all(results.map(async (result) => ({
        path: result.item,
        value: (await readStyle({ path: result.item })).value,
    })));
}