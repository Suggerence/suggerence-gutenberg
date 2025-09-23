import { useMutation, useQueryClient } from '@tanstack/react-query';
import { contentQueryKeys } from '../query-options';
import type { ContentType } from '../types';

// This file is prepared for future mutations like creating, updating, or deleting content
// Currently, PostSelector is read-only, but this structure allows for easy extension

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

// Example structure for future content mutations
// export const useCreateContent = (contentType: ContentType) => {
//     const queryClient = useQueryClient();
//
//     return useMutation({
//         mutationFn: (data: CreateContentData) => createContent(contentType, data),
//         onSuccess: () => {
//             queryClient.invalidateQueries({ queryKey: contentQueryKeys.lists() });
//         },
//     });
// };

// export const useUpdateContent = (contentType: ContentType) => {
//     const queryClient = useQueryClient();
//
//     return useMutation({
//         mutationFn: ({ id, data }: { id: number; data: UpdateContentData }) =>
//             updateContent(contentType, id, data),
//         onSuccess: (_, { id }) => {
//             queryClient.invalidateQueries({ queryKey: contentQueryKeys.detail(contentType, id) });
//             queryClient.invalidateQueries({ queryKey: contentQueryKeys.lists() });
//         },
//     });
// };

// export const useDeleteContent = (contentType: ContentType) => {
//     const queryClient = useQueryClient();
//
//     return useMutation({
//         mutationFn: (id: number) => deleteContent(contentType, id),
//         onSuccess: (_, id) => {
//             queryClient.removeQueries({ queryKey: contentQueryKeys.detail(contentType, id) });
//             queryClient.invalidateQueries({ queryKey: contentQueryKeys.lists() });
//         },
//     });
// };