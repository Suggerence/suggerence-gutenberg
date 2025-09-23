import { useState, useEffect } from '@wordpress/element';
import { SearchControl, Button, Icon } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { check } from '@wordpress/icons';
import { useSelect } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { BlockTitle, BlockIcon } from '@wordpress/block-editor';
import { getBlockType } from '@wordpress/blocks';
import type { BlockInstance } from '@wordpress/blocks';
import { useDebounce } from '@/shared/hooks/useDebounce';
import {
    getBlocksWithHierarchy,
    highlightBlock,
    removeBlockHighlight,
} from '@/shared/components/BlockSelector/api';
import type { BlockSelectorProps } from '@/shared/components/BlockSelector/types';

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
        onBlockSelect(block);
    };

    const handleBlockHover = (blockId: string) => {
        if (hoveredBlockId && hoveredBlockId !== blockId) {
            removeBlockHighlight(hoveredBlockId);
        }
        setHoveredBlockId(blockId);
        highlightBlock(blockId);
    };

    const handleBlockLeave = (blockId: string) => {
        setHoveredBlockId(null);
        removeBlockHighlight(blockId);
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

    if (blocks.length === 0) {
        return (
            <div className={className} style={{ padding: '16px', minWidth: '320px', maxWidth: '400px' }}>
                <div style={{
                    textAlign: 'center',
                    padding: '20px',
                    color: '#6b7280',
                    fontSize: '14px'
                }}>
                    {__('No blocks found in the current document.', 'suggerence-gutenberg')}
                </div>
            </div>
        );
    }

    return (
        <div className={className} style={{ padding: '16px', minWidth: '320px', maxWidth: '400px' }}>
            <SearchControl
                value={searchTerm}
                onChange={setSearchTerm}
                placeholder={__('Search blocks...', 'suggerence-gutenberg')}
                style={{ marginBottom: '12px' }}
            />

            {filteredBlocks.length === 0 && debouncedSearchTerm && (
                <div style={{
                    textAlign: 'center',
                    padding: '20px',
                    color: '#6b7280',
                    fontSize: '14px'
                }}>
                    {__('No blocks found matching your search.', 'suggerence-gutenberg')}
                </div>
            )}

            {filteredBlocks.length > 0 && (
                <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                    {filteredBlocks.map(block => (
                        <Button
                            key={block.clientId}
                            onClick={() => handleBlockClick(block)}
                            onMouseEnter={() => handleBlockHover(block.clientId)}
                            onMouseLeave={() => handleBlockLeave(block.clientId)}
                            className={`block-editor-list-view-block-select-button ${selectedBlockId === block.clientId ? 'is-selected' : ''}`}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                width: '100%',
                                padding: '8px',
                                marginBottom: '0px',
                                backgroundColor: selectedBlockId === block.clientId ? '#2271b1' : 'transparent',
                                border: 'none',
                                borderRadius: '2px',
                                textAlign: 'left',
                                cursor: 'pointer',
                                minHeight: '28px',
                                paddingLeft: showBlockHierarchy ? `${8 + (block.depth * 28)}px` : '8px',
                                color: selectedBlockId === block.clientId ? 'white' : '#1e1e1e'
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }}>
                                <BlockIcon
                                    icon={getBlockType(block.name)?.icon}
                                    showColors={true}
                                    style={{
                                        width: '16px',
                                        height: '16px',
                                        flexShrink: 0
                                    }}
                                />
                                <div style={{
                                    flex: 1,
                                    minWidth: 0,
                                    fontSize: '13px',
                                    lineHeight: '20px',
                                    fontWeight: '400'
                                }}>
                                    <BlockTitle
                                        clientId={block.clientId}
                                        context="list-view"
                                    />
                                </div>
                                {/* Block preview for images */}
                                {block.name === 'core/image' && block.attributes?.url && (
                                    <div style={{
                                        width: '24px',
                                        height: '24px',
                                        borderRadius: '2px',
                                        overflow: 'hidden',
                                        flexShrink: 0
                                    }}>
                                        <img
                                            src={block.attributes.url}
                                            alt=""
                                            style={{
                                                width: '100%',
                                                height: '100%',
                                                objectFit: 'cover'
                                            }}
                                        />
                                    </div>
                                )}
                                {/* Block preview for other media blocks */}
                                {(block.name === 'core/video' || block.name === 'core/audio') && block.attributes?.src && (
                                    <div style={{
                                        width: '24px',
                                        height: '24px',
                                        borderRadius: '2px',
                                        backgroundColor: '#f0f0f0',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexShrink: 0
                                    }}>
                                        <Icon
                                            icon={block.name === 'core/video' ? 'video-alt2' : 'media-audio'}
                                            size={12}
                                            style={{ color: '#666' }}
                                        />
                                    </div>
                                )}
                            </div>
                            {selectedBlockId === block.clientId && (
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

export default BlockSelector;