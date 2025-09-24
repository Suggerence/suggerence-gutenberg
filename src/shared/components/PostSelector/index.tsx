import { useState, useMemo } from '@wordpress/element';
import { SearchControl, Spinner, Button, Icon } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { post as postIcon, page as pageIcon, check } from '@wordpress/icons';
import { useQuery } from '@tanstack/react-query';
import { useDebounce } from '@/shared/hooks/useDebounce';
import { contentListOptions } from '@/shared/components/PostSelector/query-options';

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

    const getContentIcon = (type: ContentType) => {
        switch (type) {
            case 'page':
                return pageIcon;
            case 'post':
            default:
                return postIcon;
        }
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

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString();
    };

    if (error) {
        return (
            <div className={className} style={{ padding: '16px', minWidth: '320px', maxWidth: '400px' }}>
                <div style={{
                    textAlign: 'center',
                    padding: '20px',
                    color: '#dc2626',
                    fontSize: '14px'
                }}>
                    {__('Error loading content. Please try again.', 'suggerence-gutenberg')}
                </div>
            </div>
        );
    }

    return (
        <div className={className} style={{ padding: '16px', minWidth: '320px', maxWidth: '400px' }}>
            <SearchControl
                value={searchTerm}
                onChange={setSearchTerm}
                placeholder={placeholder || __(`Search ${getContentTypeLabel(contentType)}...`, 'suggerence-gutenberg')}
                style={{ marginBottom: '12px' }}
            />

            {isLoading && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                    <Spinner />
                </div>
            )}

            {!isLoading && content.length === 0 && (
                <div style={{
                    textAlign: 'center',
                    padding: '20px',
                    color: '#6b7280',
                    fontSize: '14px'
                }}>
                    {debouncedSearchTerm
                        ? __(`No ${getContentTypeLabel(contentType)} found matching your search.`, 'suggerence-gutenberg')
                        : __(`No ${getContentTypeLabel(contentType)} found.`, 'suggerence-gutenberg')
                    }
                </div>
            )}

            {!isLoading && content.length > 0 && (
                <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                    {content.map(item => (
                        <Button
                            key={item.id}
                            onClick={() => handleContentClick(item)}
                            className={`content-selector-item ${selectedContentId === item.id ? 'is-selected' : ''}`}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                width: '100%',
                                padding: '8px',
                                marginBottom: '0px',
                                backgroundColor: selectedContentId === item.id ? '#2271b1' : 'transparent',
                                border: 'none',
                                borderRadius: '2px',
                                textAlign: 'left',
                                cursor: 'pointer',
                                minHeight: '44px',
                                color: selectedContentId === item.id ? 'white' : '#1e1e1e',
                                justifyContent: 'flex-start'
                            }}
                            onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => {
                                if (selectedContentId !== item.id) {
                                    (e.currentTarget as HTMLElement).style.backgroundColor = '#f6f7f7';
                                }
                            }}
                            onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => {
                                if (selectedContentId !== item.id) {
                                    (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
                                }
                            }}
                        >
                            <Icon
                                icon={getContentIcon(contentType)}
                                size={16}
                                style={{
                                    color: selectedContentId === item.id ? 'white' : '#6b7280',
                                    flexShrink: 0
                                }}
                            />
                            <div style={{
                                flex: 1,
                                minWidth: 0,
                                overflow: 'hidden'
                            }}>
                                <div style={{
                                    fontWeight: '500',
                                    fontSize: '13px',
                                    lineHeight: '20px',
                                    marginBottom: '2px',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis'
                                }}>
                                    {stripHtml(item.title.rendered) || __('(No title)', 'suggerence-gutenberg')}
                                </div>
                                {item.excerpt.rendered && stripHtml(item.excerpt.rendered).trim() && (
                                    <div style={{
                                        fontSize: '11px',
                                        color: selectedContentId === item.id ? 'rgba(255,255,255,0.8)' : '#666666',
                                        lineHeight: '16px',
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis'
                                    }}>
                                        {stripHtml(item.excerpt.rendered)}
                                    </div>
                                )}
                            </div>
                            <div style={{
                                fontSize: '11px',
                                color: selectedContentId === item.id ? 'rgba(255,255,255,0.7)' : '#999999',
                                flexShrink: 0,
                                marginLeft: '8px'
                            }}>
                                #{item.id}
                            </div>
                            {selectedContentId === item.id && (
                                <Icon
                                    icon={check}
                                    size={16}
                                    style={{
                                        color: 'white',
                                        flexShrink: 0,
                                        marginLeft: '4px'
                                    }}
                                />
                            )}
                        </Button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default PostSelector;