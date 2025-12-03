import { apiFetch } from '@/lib/api';

export const getBlocks = async (): Promise<Partial<GeneratedBlock>[]> =>
{
    return apiFetch({
        path: 'blocks',
        method: `GET`
    });
}

export const getBlock = async (blockId: string): Promise<Partial<GeneratedBlock>> =>
{
    return apiFetch({
        path: `blocks/${blockId}`,
        method: `GET`
    });
}

export const storeBlock = async (block: Partial<GeneratedBlock>): Promise<boolean> =>
{
    return apiFetch({
        path: `blocks`,
        method: 'POST',
        body: JSON.stringify(block),
        headers: { 'Content-Type': 'application/json' }
    });
}

export const updateBlock = async (blockId: string, block: Partial<GeneratedBlock>): Promise<boolean> =>
{
    return apiFetch({
        path: `blocks/${blockId}/update`,
        method: 'POST',
        body: JSON.stringify(block),
        headers: { 'Content-Type': 'application/json' }
    });
}

export const deleteBlock = async (blockId: string): Promise<boolean> =>
{
    return apiFetch({
        path: `blocks/${blockId}/delete`,
        method: 'POST'
    });
}