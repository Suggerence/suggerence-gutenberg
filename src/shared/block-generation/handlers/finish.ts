import { useCallback } from '@wordpress/element';

import { useBlocksStore } from "@/apps/block-generator/stores/blocks";

export const useFinishHandler = () =>
{
    const { setBlockId } = useBlocksStore();

    return useCallback(() =>
    {
        setBlockId(undefined);
    }, [setBlockId]);
}