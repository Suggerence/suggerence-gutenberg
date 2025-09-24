import { useSelect, useDispatch } from '@wordpress/data';
import { Icon } from '@wordpress/components';
import { post, close } from '@wordpress/icons';
import { useState } from '@wordpress/element';

export const BlockBadge = () => {
    const [isHovered, setIsHovered] = useState(false);

    // @ts-ignore - WordPress types not available
    const { clearSelectedBlock } = useDispatch('core/block-editor');

    const blockInfo = useSelect((select): BlockInfo | null => {
        try {
            // @ts-ignore - WordPress types not available
            const { getSelectedBlock } = select('core/block-editor');
            const selectedBlock = getSelectedBlock?.();

            if (!selectedBlock) {
                return null;
            }

            // Get block type information from WordPress registry
            const blockName = selectedBlock.name || 'Unknown';

            // Try to get the block type from WordPress blocks registry
            // @ts-ignore - WordPress types not available
            const blockType = window.wp?.blocks?.getBlockType?.(blockName);

            let displayTitle = blockName
                .replace('core/', '')
                .replace(/-/g, ' ')
                .replace(/\b\w/g, (l: string) => l.toUpperCase());

            let blockIcon = post;

            if (blockType) {
                displayTitle = blockType.title || displayTitle;
                blockIcon = blockType.icon?.src || blockType.icon || post;
            }

            return {
                name: blockName,
                title: displayTitle,
                icon: blockIcon
            };
        } catch (error) {
            console.warn('Error getting block info:', error);
            return null;
        }
    }, []);

    const handleDeselectBlock = () => {
        clearSelectedBlock?.();
        setIsHovered(false)
    };

    if (!blockInfo) {
        return null;
    }

    return (
        <div>
            <span
                className="block-badge"
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
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                onClick={handleDeselectBlock}
                title="Click to deselect block"
            >
                <Icon
                    icon={isHovered ? close : blockInfo.icon}
                    size={12}
                    style={{
                        color: isHovered ? '#ef4444' : '#64748b',
                        transition: 'color 0.15s ease'
                    }}
                />
                {blockInfo.title}
            </span>
        </div>
    );
};