import { useState } from '@wordpress/element';
import { Icon, MenuGroup, MenuItem, Dropdown, Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { page, post, blockDefault, edit, chevronLeft, close } from '@wordpress/icons';
import { PostSelector } from '@/shared/components/PostSelector';
import { BlockSelector } from '@/shared/components/BlockSelector';
import { BlockTitle } from '@wordpress/block-editor';
import { useContextStore } from '@/apps/gutenberg-assistant/stores/contextStore';
import type { BlockInstance } from '@wordpress/blocks';

const contextOptions: ContextOption[] = [
    {
        id: 'post',
        label: __('Post', 'suggerence-gutenberg'),
        icon: post,
    },
    {
        id: 'page',
        label: __('Page', 'suggerence-gutenberg'),
        icon: page,
    },
    {
        id: 'block',
        label: __('Block', 'suggerence-gutenberg'),
        icon: blockDefault,
    }
];

export const ContextMenuBadge = ({ onContextSelect }: ContextMenuBadgeProps) => {
    const { selectedContexts, addContext, removeContext } = useContextStore();
    const [currentView, setCurrentView] = useState<'menu' | 'content-selector' | 'block-selector'>('menu');
    const [selectedContentId, setSelectedContentId] = useState<number>();
    const [selectedBlockId, setSelectedBlockId] = useState<string>();
    const [contentType, setContentType] = useState<ContentType>('post');
    const [hoveredContextId, setHoveredContextId] = useState<string>();

    const handleContextClick = (contextId: string) => {
        if (contextId === 'post' || contextId === 'page') {
            setContentType(contextId as ContentType);
            setCurrentView('content-selector');
            return;
        }

        if (contextId === 'block') {
            setCurrentView('block-selector');
            return;
        }

        // Handle other context types normally for now
        const context: SelectedContext = {
            id: `${contextId}-${Date.now()}`,
            type: contextId,
            label: contextOptions.find(opt => opt.id === contextId)?.label || contextId,
        };

        addContext(context);
        onContextSelect?.(context);
    };

    const handleContentSelect = (content: WPContent) => {
        const context: SelectedContext = {
            id: `${contentType}-${content.id}`,
            type: contentType,
            label: content.title.rendered.replace(/<[^>]*>/g, '') || `${contentType} ${content.id}`,
            data: content
        };

        addContext(context);
        setSelectedContentId(content.id);
        onContextSelect?.(context);
        setCurrentView('menu');
    };

    const getBlockTitleForBadge = (block: BlockInstance): string => {
        // Try to get content from common block attributes first
        if (block.attributes?.content) {
            const content = stripHtml(block.attributes.content);
            if (content.trim() && content.length > 0) {
                return content.length > 30 ? content.substring(0, 30) + '...' : content;
            }
        }

        if (block.attributes?.text) {
            const text = stripHtml(block.attributes.text);
            if (text.trim() && text.length > 0) {
                return text.length > 30 ? text.substring(0, 30) + '...' : text;
            }
        }

        if (block.attributes?.title) {
            return stripHtml(block.attributes.title);
        }

        // Fallback to formatted block name
        return block.name.replace('core/', '').split('-').map((word: string) =>
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
    };

    const stripHtml = (html: string): string => {
        if (!html || typeof html !== 'string') return '';
        const tmp = document.createElement('div');
        tmp.innerHTML = html;
        return tmp.textContent || tmp.innerText || '';
    };

    const handleBlockSelect = (block: BlockInstance) => {
        const blockTitle = getBlockTitleForBadge(block);
        const context: SelectedContext = {
            id: `block-${block.clientId}`,
            type: 'block',
            label: blockTitle,
            data: block
        };

        addContext(context);
        setSelectedBlockId(block.clientId);
        onContextSelect?.(context);
        setCurrentView('menu');
    };

    const handleRemoveContext = (contextId: string) => {
        // Reset selections if removing contexts
        const removedContext = selectedContexts.find(ctx => ctx.id === contextId);
        if (removedContext?.type === 'post' || removedContext?.type === 'page') {
            setSelectedContentId(undefined);
        }
        if (removedContext?.type === 'block') {
            setSelectedBlockId(undefined);
        }
        setHoveredContextId(undefined);

        removeContext(contextId);
    };

    const handleBackToMenu = () => {
        setCurrentView('menu');
    };

    return (
        <>
            {/* Dropdown with @ button - appears first */}
            <Dropdown
                popoverProps={{ placement: 'bottom-start' }}
                renderToggle={({ isOpen, onToggle }) => (
                    <Button
                        onClick={onToggle}
                        aria-expanded={isOpen}
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '24px',
                            height: '20px',
                            backgroundColor: isOpen ? '#f1f5f9' : '#f8fafc',
                            color: '#475569',
                            border: '1px solid #e2e8f0',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: 600,
                            fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                            minHeight: 'unset',
                            padding: '0'
                        }}
                        title={__('Add context', 'suggerence-gutenberg')}
                    >
                        @
                    </Button>
                )}
                renderContent={() => (
                    <>
                        {currentView === 'menu' && (
                            <MenuGroup>
                                {contextOptions.map(option => (
                                    <MenuItem
                                        key={option.id}
                                        icon={option.icon}
                                        onClick={() => handleContextClick(option.id)}
                                        isSelected={selectedContexts.some(ctx => ctx.type === option.id)}
                                        info={option.description}
                                    >
                                        {option.label}
                                    </MenuItem>
                                ))}
                            </MenuGroup>
                        )}

                        {currentView === 'content-selector' && (
                            <div>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    padding: '8px 16px 0 16px',
                                    borderBottom: '1px solid #e5e7eb',
                                    marginBottom: '8px'
                                }}>
                                    <Button
                                        onClick={handleBackToMenu}
                                        icon={chevronLeft}
                                        size="small"
                                        variant="tertiary"
                                        style={{ minWidth: 'auto', padding: '4px' }}
                                    />
                                    <span style={{ fontSize: '14px', fontWeight: 500 }}>
                                        {contentType === 'page'
                                            ? __('Select a Page', 'suggerence-gutenberg')
                                            : __('Select a Post', 'suggerence-gutenberg')
                                        }
                                    </span>
                                </div>
                                <PostSelector
                                    onContentSelect={handleContentSelect}
                                    selectedContentId={selectedContentId}
                                    contentType={contentType}
                                />
                            </div>
                        )}

                        {currentView === 'block-selector' && (
                            <div>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    padding: '8px 16px 0 16px',
                                    borderBottom: '1px solid #e5e7eb',
                                    marginBottom: '8px'
                                }}>
                                    <Button
                                        onClick={handleBackToMenu}
                                        icon={chevronLeft}
                                        size="small"
                                        variant="tertiary"
                                        style={{ minWidth: 'auto', padding: '4px' }}
                                    />
                                    <span style={{ fontSize: '14px', fontWeight: 500 }}>
                                        {__('Select a Block', 'suggerence-gutenberg')}
                                    </span>
                                </div>
                                <BlockSelector
                                    onBlockSelect={handleBlockSelect}
                                    selectedBlockId={selectedBlockId}
                                    showBlockHierarchy={true}
                                />
                            </div>
                        )}
                    </>
                )}
            />

            {/* Selected context badges - styled like BlockBadge - appear after @ and block */}
            {selectedContexts.map(context => {
                const contextOption = contextOptions.find(opt => opt.id === context.type);
                const isHovered = hoveredContextId === context.id;

                return (
                    <span
                        key={context.id}
                        className="context-badge"
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            backgroundColor: isHovered ? '#f1f5f9' : '#f8fafc',
                            color: '#475569',
                            border: '1px solid #e2e8f0',
                            borderRadius: '4px',
                            padding: '2px 6px',
                            fontSize: '11px',
                            fontWeight: 500,
                            fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                            lineHeight: '16px',
                            cursor: 'pointer',
                            transition: 'background-color 0.15s ease'
                        }}
                        onMouseEnter={() => setHoveredContextId(context.id)}
                        onMouseLeave={() => setHoveredContextId(undefined)}
                        onClick={() => handleRemoveContext(context.id)}
                        title="Click to remove context"
                    >
                        <Icon
                            icon={isHovered ? close : (contextOption?.icon || post)}
                            size={12}
                            style={{
                                color: isHovered ? '#ef4444' : '#64748b',
                                transition: 'color 0.15s ease'
                            }}
                        />
                        {context.label}
                    </span>
                );
            })}
        </>
    );
};