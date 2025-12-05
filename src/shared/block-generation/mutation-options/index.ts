import { storeBlock, updateBlock, deleteBlock } from '@/shared/block-generation/api';

export const storeBlockMutationOptions = () =>
{
    return {
        mutationFn: (block: Partial<GeneratedBlock>) =>
        {
            return new Promise((resolve, reject) =>
            {
                storeBlock(block)
                    .then((response) => resolve(response))
                    .catch((error) => reject(error));
            });
        }
    };
}

export const updateBlockMutationOptions = () =>
{
    return {
        mutationFn: ({ blockId, block }: { blockId: string, block: Partial<GeneratedBlock> }) =>
        {
            return new Promise((resolve, reject) =>
            {
                updateBlock(blockId, block)
                    .then((response) => resolve(response))
                    .catch((error) => reject(error));
            });
        }
    };
}

export const deleteBlockMutationOptions = () =>
{
    return {
        mutationFn: (blockId: string) =>
        {
            return new Promise((resolve, reject) =>
            {
                deleteBlock(blockId)
                    .then((response) => resolve(response))
                    .catch((error) => reject(error));
            });
        }
    };
}