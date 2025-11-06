import { useEffect, useState } from '@wordpress/element';
import type { ChangeEvent } from 'react';
import { __ } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';
import { BlockTitle, BlockIcon } from '@wordpress/block-editor';
import { getBlockType } from '@wordpress/blocks';
import type { BlockInstance } from '@wordpress/blocks';
import { useDebounce } from '@/shared/hooks/useDebounce';
import {
    getBlocksWithHierarchy,
    highlightBlock,
    unhighlightBlock,
} from '@/shared/components/BlockSelector/api';
import type { BlockSelectorProps } from '@/shared/components/BlockSelector/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Check, FileAudio, Film } from 'lucide-react';

export const BlockSelector = ({
    onBlockSelect,
    selectedBlockId,
    className,
    showBlockHierarchy = true
}: BlockSelectorProps) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [hoveredBlockId, setHoveredBlockId] = useState<string | null>(null);
    const debouncedSearchTerm = useDebounce(searchTerm, 300);

    // Get blocks from WordPress data store
    const blocks = useSelect((select) => {
        return getBlocksWithHierarchy();
    }, []);

    // Filter blocks based on search term
    const filteredBlocks = blocks.filter((block) => {
        if (!debouncedSearchTerm) return true;

        const searchLower = debouncedSearchTerm.toLowerCase();
        const blockName = block.name.toLowerCase();
        const blockContent = getBlockSearchText(block).toLowerCase();

        return blockName.includes(searchLower) || blockContent.includes(searchLower);
    });

    const handleBlockClick = (block: BlockInstance) => {
        if (hoveredBlockId) {
            unhighlightBlock(hoveredBlockId);
            setHoveredBlockId(null);
        }
        unhighlightBlock(block.clientId);
        onBlockSelect(block);
    };

    const handleBlockHover = (blockId: string) => {
        if (hoveredBlockId && hoveredBlockId !== blockId) {
            unhighlightBlock(hoveredBlockId);
        }
        setHoveredBlockId(blockId);
        highlightBlock(blockId);
    };

    const handleBlockLeave = (blockId: string) => {
        setHoveredBlockId(null);
        unhighlightBlock(blockId);
    };

    const getBlockSearchText = (block: BlockInstance): string => {
        // Simple search text extraction for filtering
        const attributes = block.attributes || {};
        const textFields = ['content', 'text', 'value', 'title', 'caption', 'alt'];

        for (const field of textFields) {
            if (attributes[field] && typeof attributes[field] === 'string') {
                const tmp = document.createElement('div');
                tmp.innerHTML = attributes[field];
                return tmp.textContent || tmp.innerText || '';
            }
        }

        return '';
    };

    useEffect(() => {
        return () => {
            if (hoveredBlockId) {
                unhighlightBlock(hoveredBlockId);
            }
        };
    }, [hoveredBlockId]);

    if (blocks.length === 0) {
        return (
            <div className={cn('flex w-full flex-col gap-3 p-4 text-sm text-muted-foreground', className)}>
                <div className="rounded-md border border-dashed border-border bg-muted/50 px-4 py-6 text-center text-xs">
                    {__('No blocks found in the current document.', 'suggerence-gutenberg')}
                </div>
            </div>
        );
    }

    return (
        <div className={cn('flex w-full flex-col gap-3', className)}>
            <Input
                value={searchTerm}
                onChange={(event: ChangeEvent<HTMLInputElement>) => setSearchTerm(event.target.value)}
                placeholder={__('Search blocks...', 'suggerence-gutenberg')}
                className="h-9 text-sm"
            />

            {filteredBlocks.length === 0 && debouncedSearchTerm && (
                <div className="rounded-md border border-dashed border-border bg-muted/50 px-4 py-6 text-center text-xs text-muted-foreground">
                    {__('No blocks found matching your search.', 'suggerence-gutenberg')}
                </div>
            )}

            {filteredBlocks.length > 0 && (
                <div className="max-h-72 space-y-1 overflow-y-auto pr-1">
                    {filteredBlocks.map(block => (
                        <Button
                            key={block.clientId}
                            onClick={() => handleBlockClick(block)}
                            onMouseEnter={() => handleBlockHover(block.clientId)}
                            onMouseLeave={() => handleBlockLeave(block.clientId)}
                            variant={selectedBlockId === block.clientId ? 'default' : 'ghost'}
                            className={cn(
                                'w-full justify-start gap-2 px-2 py-2 text-sm transition-colors',
                                selectedBlockId === block.clientId
                                    ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                                    : 'text-foreground hover:bg-muted',
                            )}
                            style={{
                                paddingLeft: showBlockHierarchy ? 12 + (block.depth * 20) : 12,
                            }}
                        >
                            <div className="flex flex-1 items-center gap-2">
                                <BlockIcon
                                    icon={getBlockType(block.name)?.icon}
                                    showColors={true}
                                    style={{
                                        width: '16px',
                                        height: '16px',
                                        flexShrink: 0
                                    }}
                                />
                                <div className="flex-1 min-w-0 text-left text-sm font-normal leading-5">
                                    <BlockTitle
                                        clientId={block.clientId}
                                    />
                                </div>
                                {/* Block preview for images */}
                                {block.name === 'core/image' && block.attributes?.url && (
                                    <div className="h-6 w-6 overflow-hidden rounded">
                                        <img
                                            src={block.attributes.url}
                                            alt=""
                                            className="h-full w-full object-cover"
                                        />
                                    </div>
                                )}
                                {/* Block preview for other media blocks */}
                                {(block.name === 'core/video' || block.name === 'core/audio') && block.attributes?.src && (
                                    <div className="flex h-6 w-6 items-center justify-center rounded bg-muted text-muted-foreground">
                                        {block.name === 'core/video' ? (
                                            <Film className="h-3.5 w-3.5" />
                                        ) : (
                                            <FileAudio className="h-3.5 w-3.5" />
                                        )}
                                    </div>
                                )}
                            </div>
                            {selectedBlockId === block.clientId && (
                                <Check className="h-4 w-4 flex-shrink-0" />
                            )}
                        </Button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default BlockSelector;
