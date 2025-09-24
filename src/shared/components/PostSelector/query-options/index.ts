import { queryOptions } from '@tanstack/react-query';
import { fetchContent, fetchContentById } from '@/shared/components/PostSelector/api';

export const contentQueryKeys = {
    all: ['content'] as const,
    lists: () => [...contentQueryKeys.all, 'list'] as const,
    list: (contentType: ContentType, params: ContentSearchParams) =>
        [...contentQueryKeys.lists(), contentType, params] as const,
    details: () => [...contentQueryKeys.all, 'detail'] as const,
    detail: (contentType: ContentType, id: number) =>
        [...contentQueryKeys.details(), contentType, id] as const,
};

export const contentListOptions = (
    contentType: ContentType = 'post',
    params: ContentSearchParams = {}
) =>
    queryOptions({
        queryKey: contentQueryKeys.list(contentType, params),
        queryFn: () => fetchContent(contentType, params),
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes
        retry: 2,
        refetchOnWindowFocus: false,
    });

export const contentDetailOptions = (
    id: number,
    contentType: ContentType = 'post'
) =>
    queryOptions({
        queryKey: contentQueryKeys.detail(contentType, id),
        queryFn: () => fetchContentById(id, contentType),
        staleTime: 10 * 60 * 1000, // 10 minutes
        gcTime: 30 * 60 * 1000, // 30 minutes
        retry: 2,
        refetchOnWindowFocus: false,
        enabled: !!id,
    });