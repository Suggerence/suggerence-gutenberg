import { useMutation, useQueryClient } from '@tanstack/react-query';
import { contentQueryKeys } from '@/shared/components/PostSelector/query-options';


export const useInvalidateContentQueries = () => {
    const queryClient = useQueryClient();

    return {
        invalidateAll: () => queryClient.invalidateQueries({ queryKey: contentQueryKeys.all }),
        invalidateList: (contentType: ContentType) =>
            queryClient.invalidateQueries({ queryKey: contentQueryKeys.lists() }),
        invalidateDetail: (contentType: ContentType, id: number) =>
            queryClient.invalidateQueries({ queryKey: contentQueryKeys.detail(contentType, id) }),
    };
};