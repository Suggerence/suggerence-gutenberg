import { queryOptions } from "@tanstack/react-query";
import { getProviders } from '@/shared/ai-providers/api';

export const getProvidersQueryOptions = () => {
    return queryOptions({
        queryKey: ['ai-providers'],
        queryFn: () => getProviders(),
    })
};