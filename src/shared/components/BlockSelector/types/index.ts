import type { BlockInstance } from '@wordpress/blocks';

interface BlockTreeItem extends BlockInstance {
    depth: number;
    hasChildren: boolean;
}

export interface BlockSelectorProps {
    onBlockSelect: (block: BlockInstance) => void;
    selectedBlockId?: string;
    className?: string;
    showBlockHierarchy?: boolean;
}

interface BlockHoverState {
    blockId: string | null;
    isHovering: boolean;
}