import { queryOptions } from "@tanstack/react-query";
import { getBlocks, getBlock } from "@/shared/block-generation/api";

export const getBlocksQueryOptions = () =>
{
    return queryOptions({
        queryKey: ['blocks'],
        queryFn: getBlocks
    });
}

export const getBlockQueryOptions = (blockId: string) =>
{
    return queryOptions({
        queryKey: ['block', blockId],
        queryFn: async () => {
            const response = await getBlock(blockId);
            
            if (response && typeof response === 'object' && 'errors' in response && 'error_data' in response) {
                throw new Error('Block not found');
            }
            
            return response;
        },
        refetchInterval: (query) => {
            return query.state.error ? 1000 : false;
        }
    });
}