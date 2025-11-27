import { useCallback } from '@wordpress/element';

import { useBlocksStore } from "@/apps/block-generator/stores/blocks";

export const useFinishHandler = () =>
{
    const { blockId, setBlockId } = useBlocksStore();

    return useCallback(() =>
    {
        if (!blockId) return;

        setBlockId(undefined);
    }, [blockId, setBlockId]);
}