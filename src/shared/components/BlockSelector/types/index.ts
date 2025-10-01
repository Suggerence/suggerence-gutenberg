import type { BlockInstance } from '@wordpress/blocks';

export interface BlockTreeItem extends BlockInstance {
    depth: number;
    hasChildren: boolean;
}

export interface BlockSelectorProps {
    onBlockSelect: (block: BlockInstance) => void;
    selectedBlockId?: string;
    className?: string;
    showBlockHierarchy?: boolean;
}

export interface BlockHoverState {
    blockId: string | null;
    isHovering: boolean;
}