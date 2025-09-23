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
 * Debug function to find what selectors exist for blocks
 */
const debugBlockSelectors = (clientId: string): void => {
    const possibleSelectors = [
        `[data-block="${clientId}"]`,
        `#block-${clientId}`,
        `.wp-block[data-block="${clientId}"]`,
        `.block-editor-block-list__block[data-block="${clientId}"]`,
        `[data-type] [data-block="${clientId}"]`,
        `.editor-block-list__block[data-block="${clientId}"]`,
        `.wp-block`,
        `[data-block]`,
        `.block-editor-block-list__block`
    ];

    console.log(`Debug: Looking for block ${clientId}`);
    possibleSelectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
            console.log(`Found ${elements.length} elements with selector: ${selector}`);
        }
    });

    // Show all blocks with data-block attributes
    const allBlocks = document.querySelectorAll('[data-block]');
    console.log(`Total blocks with data-block: ${allBlocks.length}`);
    allBlocks.forEach((block, index) => {
        const id = block.getAttribute('data-block');
        if (index < 5) { // Show first 5 for debugging
            console.log(`Block ${index}: data-block="${id}"`);
        }
    });
};

/**
 * Highlight/hover a block in the editor (visual feedback)
 */
export const highlightBlock = (clientId: string): void => {
    const { toggleBlockHighlight } = dispatch(blockEditorStore);

    if (toggleBlockHighlight) {
        toggleBlockHighlight(clientId, true);
        return;
    }
};

/**
 * Remove highlight from a block
 */
export const removeBlockHighlight = (clientId: string): void => {
    // Use WordPress dispatch to remove block hover state
    const { toggleBlockHighlight } = dispatch(blockEditorStore);

    if (toggleBlockHighlight) {
        toggleBlockHighlight(clientId, false);
        return;
    }
};