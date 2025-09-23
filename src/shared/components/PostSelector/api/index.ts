import apiFetch from '@wordpress/api-fetch';
import type { ContentSearchParams, WPContent, ContentType } from '../types';

const getEndpoint = (contentType: ContentType): string => {
    switch (contentType) {
        case 'post':
            return 'wp/v2/posts';
        case 'page':
            return 'wp/v2/pages';
        default:
            return `wp/v2/${contentType}s`;
    }
};

export const fetchContent = async (
    contentType: ContentType = 'post',
    params: ContentSearchParams = {}
): Promise<WPContent[]> => {
    const defaultParams: ContentSearchParams = {
        per_page: 10,
        status: 'publish',
        orderby: 'date',
        order: 'desc',
        ...params,
    };

    const searchParams = new URLSearchParams();

    Object.entries(defaultParams).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
            searchParams.append(key, String(value));
        }
    });

    const endpoint = getEndpoint(contentType);
    const url = `${endpoint}?${searchParams.toString()}`;

    try {
        const response: WPContent[] = await apiFetch({
            path: url,
            method: 'GET',
        });

        return response;
    } catch (error) {
        console.error(`Error fetching ${contentType}s:`, error);
        throw error;
    }
};

export const fetchContentById = async (
    id: number,
    contentType: ContentType = 'post'
): Promise<WPContent> => {
    const endpoint = getEndpoint(contentType);

    try {
        const response: WPContent = await apiFetch({
            path: `${endpoint}/${id}`,
            method: 'GET',
        });

        return response;
    } catch (error) {
        console.error(`Error fetching ${contentType} with ID ${id}:`, error);
        throw error;
    }
};