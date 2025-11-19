import { useMemo, useState } from '@wordpress/element';
import type { ChangeEvent } from 'react';
import { __ } from '@wordpress/i18n';
import { useQuery } from '@tanstack/react-query';
import { useDebounce } from '@/shared/hooks/useDebounce';
import { contentListOptions } from '@/shared/components/PostSelector/query-options';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Check, Loader2, FileText, ScrollText } from 'lucide-react';

const iconByType: Record<ContentType, typeof FileText> = {
    post: FileText,
    page: ScrollText
};

const getContentTypeLabel = (type: ContentType) => {
    switch (type) {
        case 'page':
            return __('pages', 'suggerence-gutenberg');
        case 'post':
        default:
            return __('posts', 'suggerence-gutenberg');
    }
};

const stripHtml = (html: string) => {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
};

export const PostSelector = ({
    onContentSelect,
    selectedContentId,
    contentType = 'post',
    placeholder,
    className,
    maxResults = 10
}: ContentSelectorProps) => {
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearchTerm = useDebounce(searchTerm, 300);

    const queryParams = useMemo(() => ({
        search: debouncedSearchTerm || undefined,
        per_page: maxResults,
        status: 'publish'
    }), [debouncedSearchTerm, maxResults]);

    const {
        data: content = [],
        isLoading,
        error
    } = useQuery(contentListOptions(contentType, queryParams));

    const handleContentClick = (item: WPContent) => {
        onContentSelect(item);
    };

    const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(event.target.value);
    };

    if (error) {
        return (
            <div className={cn('flex w-full flex-col gap-3', className)}>
                <div className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-6 text-center text-sm text-destructive">
                    {__('Error loading content. Please try again.', 'suggerence-gutenberg')}
                </div>
            </div>
        );
    }

    return (
        <div className={cn('flex w-full flex-col gap-3', className)}>
            <Input
                value={searchTerm}
                onChange={handleSearchChange}
                placeholder={placeholder || __(`Search ${getContentTypeLabel(contentType)}...`, 'suggerence-gutenberg')}
                className="h-9 text-sm"
            />

            {isLoading && (
                <div className="flex items-center justify-center py-6">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
            )}

            {!isLoading && content.length === 0 && (
                <div className="rounded-md border border-dashed border-border bg-muted/50 px-4 py-6 text-center text-xs text-muted-foreground">
                    {debouncedSearchTerm
                        ? __(`No ${getContentTypeLabel(contentType)} found matching your search.`, 'suggerence-gutenberg')
                        : __(`No ${getContentTypeLabel(contentType)} found.`, 'suggerence-gutenberg')
                    }
                </div>
            )}

            {!isLoading && content.length > 0 && (
                <div className="max-h-72 space-y-1 overflow-y-auto pr-1">
                    {content.map(item => {
                        const IconComponent = iconByType[contentType];
                        const isSelected = selectedContentId === item.id;

                        return (
                            <Button
                                key={item.id}
                                onClick={() => handleContentClick(item)}
                                variant={isSelected ? 'default' : 'ghost'}
                                className={cn(
                                    'w-full justify-start gap-3 px-3 py-2 text-sm transition-colors',
                                    isSelected
                                        ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                                        : 'text-foreground hover:bg-muted'
                                )}
                            >
                                <IconComponent
                                    className={cn(
                                        'h-4 w-4 flex-shrink-0',
                                        isSelected ? 'text-primary-foreground' : 'text-muted-foreground'
                                    )}
                                />
                                <div className="min-w-0 flex-1">
                                    <div className="truncate text-sm font-medium leading-5 text-start">
                                        {stripHtml(item.title.rendered) || __('(No title)', 'suggerence-gutenberg')}
                                    </div>
                                    {item.excerpt.rendered && stripHtml(item.excerpt.rendered).trim() && (
                                        <div className={cn(
                                            'truncate text-xs text-start',
                                            isSelected ? 'text-primary-foreground/80' : 'text-muted-foreground'
                                        )}>
                                            {stripHtml(item.excerpt.rendered)}
                                        </div>
                                    )}
                                </div>
                                <div className={cn(
                                    'text-xs font-medium text-muted-foreground',
                                    isSelected && 'text-primary-foreground/80'
                                )}>
                                    #{item.id}
                                </div>
                                {isSelected && <Check className="h-4 w-4 flex-shrink-0" />}
                            </Button>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default PostSelector;
