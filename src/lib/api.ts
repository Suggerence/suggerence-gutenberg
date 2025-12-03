import fetch, { APIFetchOptions } from '@wordpress/api-fetch';
import { BLOCKS_API_NAMESPACE } from '@/apps/block-generator/constants/api';

export const apiFetch = async <T>(options: APIFetchOptions<true>): Promise<T> =>
{
    fetch.use(fetch.createNonceMiddleware(SuggerenceData.nonce));

    return fetch<T>({
        ...options,
        path: `${BLOCKS_API_NAMESPACE}/${options.path}`
    });
}