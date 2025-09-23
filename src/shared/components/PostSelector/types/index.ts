interface WPContent {
    id: number;
    title: {
        rendered: string;
    };
    excerpt: {
        rendered: string;
    };
    status: string;
    type: string;
    date: string;
    link: string;
    slug: string;
    author: number;
    featured_media: number;
    parent?: number;
    menu_order?: number;
    template?: string;
}

interface Post extends WPContent {
    type: 'post';
    categories: number[];
    tags: number[];
    sticky: boolean;
    format: string;
}

interface Page extends WPContent {
    type: 'page';
    parent: number;
    menu_order: number;
    template: string;
}

type ContentType = 'post' | 'page';

interface ContentSelectorProps {
    onContentSelect: (content: WPContent) => void;
    selectedContentId?: number;
    contentType?: ContentType;
    placeholder?: string;
    className?: string;
    maxResults?: number;
}

interface ContentSearchParams {
    search?: string;
    per_page?: number;
    status?: string;
    type?: string;
    orderby?: string;
    order?: 'asc' | 'desc';
    parent?: number;
}

interface ContentApiResponse {
    data: WPContent[];
    total: number;
    totalPages: number;
}