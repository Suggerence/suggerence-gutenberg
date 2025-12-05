import { select, dispatch } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';
import type { BlockInstance } from '@wordpress/blocks';

/**
 * Get all blocks from the current editor with hierarchy information
 */
export const getBlocksWithHierarchy = (): Array<BlockInstance & { depth: number; hasChildren: boolean }> => {
    const blocks = select(blockEditorStore).getBlocks();

    const flattenBlocks = (blockList: BlockInstance[], depth = 0): Array<BlockInstance & { depth: number; hasChildren: boolean }> => {
        const result: Array<BlockInstance & { depth: number; hasChildren: boolean }> = [];

        blockList.forEach((block) => {
            const hasChildren = block.innerBlocks && block.innerBlocks.length > 0;

            result.push({
                ...block,
                depth,
                hasChildren
            });

            // Recursively add inner blocks
            if (hasChildren) {
                result.push(...flattenBlocks(block.innerBlocks, depth + 1));
            }
        });

        return result;
    };

    return flattenBlocks(blocks);
};

/**
 * Get block by client ID
 */
export const getBlockByClientId = (clientId: string): BlockInstance | null => {
    return select(blockEditorStore).getBlock(clientId);
};

/**
 * Select a block in the editor
 */
export const selectBlock = (clientId: string): void => {
    dispatch(blockEditorStore).selectBlock(clientId);
};

/**
 * Get the currently selected block
 */
export const getSelectedBlock = (): BlockInstance | null => {
    const clientId = select(blockEditorStore).getSelectedBlockClientId();
    return clientId ? getBlockByClientId(clientId) : null;
};


/**
 * Highlight/hover a block in the editor (visual feedback)
 */
export const highlightBlock = (clientId: string): void => {
	const { toggleBlockHighlight, updateBlockAttributes } = dispatch(blockEditorStore);
	const block = select(blockEditorStore).getBlock(clientId);

	if (!block) return;

	// 1. Toggle the native highlight (so selection visuals still work)
	toggleBlockHighlight?.(clientId, true);

	// 2. Add a custom CSS class to the block’s attributes (native way)
	const currentClasses = block.attributes.className || '';
	const customClass = 'suggerence-block-highlight';

	if (!currentClasses.includes(customClass)) {
		updateBlockAttributes(clientId, {
			className: `${currentClasses} ${customClass}`.trim(),
		});
	}
};

/**
 * Remove highlight from a block
 */
export const unhighlightBlock = (clientId: string): void => {
	const { toggleBlockHighlight, updateBlockAttributes } = dispatch(blockEditorStore);
	const block = select(blockEditorStore).getBlock(clientId);

	if (!block) return;

	toggleBlockHighlight?.(clientId, false);

	const currentClasses = block.attributes.className || '';
	const newClasses = currentClasses
		.split(' ')
		.filter((c: string) => c !== 'suggerence-block-highlight')
		.join(' ');

	updateBlockAttributes(clientId, { className: newClasses });
};

/**
 * Flash a block with the native Gutenberg flash effect
 * This creates a brief animation/highlight on the block
 */
export const flashBlock = (clientId: string): void => {
    const { flashBlock: flashBlockAction } = dispatch(blockEditorStore) as any;

    if (flashBlockAction) {
        flashBlockAction(clientId);
    }
};