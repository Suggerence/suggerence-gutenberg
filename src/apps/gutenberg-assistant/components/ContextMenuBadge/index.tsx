import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { PostSelector } from '@/shared/components/PostSelector';
import { BlockSelector } from '@/shared/components/BlockSelector';
import { useContextStore } from '@/apps/gutenberg-assistant/stores/contextStore';
import type { BlockInstance } from '@wordpress/blocks';
import { Badge } from '@/components/ui/badge';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
    ArrowLeft,
    FileText,
    ScrollText,
    SquareStack,
    X,
    Check,
    Brush,
    ImageIcon,
    Camera
} from 'lucide-react';

const contextOptions: ContextOption[] = [
    {
        id: 'post',
        label: __('Post', 'suggerence-gutenberg'),
        icon: FileText,
    },
    {
        id: 'page',
        label: __('Page', 'suggerence-gutenberg'),
        icon: ScrollText,
    },
    {
        id: 'block',
        label: __('Block', 'suggerence-gutenberg'),
        icon: SquareStack,
    }
];

const contextIconMap: Record<string, LucideIcon> = {
    post: FileText,
    page: ScrollText,
    block: SquareStack,
    drawing: Brush,
    image: ImageIcon,
    screenshot: Camera
};

export const ContextMenuBadge = ({ onContextSelect }: ContextMenuBadgeProps) => {
    const { selectedContexts, addContext, removeContext } = useContextStore();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [currentView, setCurrentView] = useState<'menu' | 'content-selector' | 'block-selector'>('menu');
    const [selectedContentId, setSelectedContentId] = useState<number>();
    const [contentType, setContentType] = useState<ContentType>('post');
    const [hoveredContextId, setHoveredContextId] = useState<string>();
    const selectedBlockIds = selectedContexts
        .filter(context => context.type === 'block')
        .map(context => context.data?.clientId || context.id.replace('block-', ''));

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
        setCurrentView('menu');
        setIsMenuOpen(false);
    };

    const handleContentSelect = (content: WPContent) => {
        if (!content) {
            return;
        }

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
        setIsMenuOpen(false);
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
        onContextSelect?.(context);
        setCurrentView('menu');
        setIsMenuOpen(false);
    };

    const handleRemoveContext = (contextId: string) => {
        // Reset selections if removing contexts
        const removedContext = selectedContexts.find(ctx => ctx.id === contextId);
        if (removedContext?.type === 'post' || removedContext?.type === 'page') {
            setSelectedContentId(undefined);
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
            <DropdownMenu open={isMenuOpen} onOpenChange={(open) => {
                setIsMenuOpen(open);
                if (!open) {
                    setCurrentView('menu');
                }
            }}>
                <DropdownMenuTrigger
                    className={cn(
                        buttonVariants({ variant: 'outline', size: 'icon-sm' }),
                        'h-6 w-7 min-w-0 rounded-[4px] border bg-card text-[12px] font-semibold font-mono leading-none text-muted-foreground hover:bg-muted hover:text-foreground'
                    )}
                    type="button"
                    aria-label={__('Add context', 'suggerence-gutenberg')}
                >
                    @
                </DropdownMenuTrigger>
                <DropdownMenuContent
                    side="top"
                    align="start"
                    className="w-[320px] border border-border bg-card p-0 text-card-foreground shadow-lg"
                >
                    {currentView === 'menu' && (
                        <div className="py-1">
                            {contextOptions.map((option) => {
                                const isOptionSelected = selectedContexts.some(ctx => ctx.type === option.id);

                                return (
                                    <DropdownMenuItem
                                        key={option.id}
                                        data-selected={isOptionSelected}
                                        onSelect={(event) => {
                                            event.preventDefault();
                                            handleContextClick(option.id);
                                        }}
                                        className={cn(
                                            'flex items-center gap-2 px-3 py-2 text-sm font-medium',
                                            isOptionSelected && 'bg-muted text-foreground'
                                        )}
                                    >
                                        <option.icon className="h-4 w-4 text-muted-foreground" />
                                        <span className="flex-1">{option.label}</span>
                                        {isOptionSelected && (
                                            <Check className="h-3.5 w-3.5 text-muted-foreground" />
                                        )}
                                    </DropdownMenuItem>
                                );
                            })}
                        </div>
                    )}

                    {currentView === 'content-selector' && (
                        <div className="flex max-h-[360px] flex-col">
                            <div className="flex items-center gap-2 border-b border-border px-3 py-2">
                                <Button
                                    variant="ghost"
                                    size="icon-sm"
                                    className="h-7 w-7"
                                    onClick={handleBackToMenu}
                                >
                                    <ArrowLeft className="h-4 w-4" />
                                </Button>
                                <span className="text-sm font-medium">
                                    {contentType === 'page'
                                        ? __('Select a Page', 'suggerence-gutenberg')
                                        : __('Select a Post', 'suggerence-gutenberg')}
                                </span>
                            </div>
                            <PostSelector
                                onContentSelect={handleContentSelect}
                                selectedContentId={selectedContentId}
                                contentType={contentType}
                                className="flex-1 overflow-y-auto px-3 py-2"
                            />
                        </div>
                    )}

                    {currentView === 'block-selector' && (
                        <div className="flex max-h-[360px] flex-col">
                            <div className="flex items-center gap-2 border-b border-border px-3 py-2">
                                <Button
                                    variant="ghost"
                                    size="icon-sm"
                                    className="h-7 w-7"
                                    onClick={handleBackToMenu}
                                >
                                    <ArrowLeft className="h-4 w-4" />
                                </Button>
                                <span className="text-sm font-medium">
                                    {__('Select a Block', 'suggerence-gutenberg')}
                                </span>
                            </div>
                            <BlockSelector
                                onBlockSelect={handleBlockSelect}
                                selectedBlockIds={selectedBlockIds}
                                showBlockHierarchy={true}
                                className="flex-1 overflow-y-auto px-3 py-2"
                            />
                        </div>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>

            {/* Selected context badges - styled like BlockBadge - appear after @ and block */}
            {selectedContexts.map(context => {
                const isHovered = hoveredContextId === context.id;
                const IconComponent = contextIconMap[context.type] || FileText;

                return (
                    <Badge
                        key={context.id}
                        variant="outline"
                        className="gap-1 cursor-pointer font-mono hover:bg-muted transition-colors flex items-center"
                        onMouseEnter={() => setHoveredContextId(context.id)}
                        onMouseLeave={() => setHoveredContextId(undefined)}
                        onClick={() => handleRemoveContext(context.id)}
                        title={__('Click to remove context', 'suggerence-gutenberg')}
                    >
                        {isHovered ? (
                            <X className="h-3 w-3 text-destructive" />
                        ) : (
                            <IconComponent className="h-3.5 w-3.5 text-muted-foreground" />
                        )}
                        {context.label}
                    </Badge>
                );
            })}
        </>
    );
};
