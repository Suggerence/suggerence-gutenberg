import { useSelect, useDispatch } from '@wordpress/data';
import { Icon } from '@wordpress/components';
import { post, close } from '@wordpress/icons';
import { useState } from '@wordpress/element';
import { Badge } from '@/components/ui/badge';

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
        <Badge
            variant="outline"
            className="gap-1 cursor-pointer font-mono hover:bg-muted transition-colors flex items-center"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={handleDeselectBlock}
            title="Click to deselect block"
        >

            <Icon
                icon={isHovered ? close : blockInfo.icon}
                size={12}
                className={isHovered ? 'fill-destructive' : 'fill-muted-foreground'}
            />
            {blockInfo.title}
        </Badge>
    );
};