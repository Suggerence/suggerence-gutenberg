import { useState, useEffect } from '@wordpress/element';

import { useQuery, useQueryClient } from '@tanstack/react-query';

import { getBlocksQueryOptions } from '@/shared/block-generation/query-options';

import { loadBlockIntoEditor } from '@/lib/block';

export const BlockInserter = () =>
{
    const [loadedBlocks, setLoadedBlocks] = useState<Set<string>>(new Set());
    const queryClient = useQueryClient();

    const { data: blocks = [] } = useQuery(getBlocksQueryOptions());

    const finishedBlocks = blocks.filter((block) => block.status === 'completed');

    const insertAllFinishedBlocks = async () =>
    {
        const loadPromises = finishedBlocks.map(async (block) =>
        {
            // Skip if block already loaded
            if (loadedBlocks.has(block.id ?? '')) return;

            const blockData = queryClient.getQueryData<Partial<GeneratedBlock>>(['block', block.id ?? '']);

            try {
                const result = await loadBlockIntoEditor(blockData ?? {});
                if (result.success) {
                    setLoadedBlocks(prev => new Set(prev).add(block.id ?? ''));
                    console.log(`Block ${block.slug ?? block.id ?? 'unknown'} loaded successfully`);
                }
                else {
                    console.warn(`Failed to load block ${block.slug ?? block.id ?? 'unknown'}: ${result.message}`);
                }
            }
            catch (error) {
                console.error(`Error loading block ${block.slug ?? block.id ?? 'unknown'}: ${error instanceof Error ? error.message : String(error ?? 'Unknown error')}`);
            }
        });

        await Promise.all(loadPromises);
    };

    useEffect(() => {
        insertAllFinishedBlocks();
    }, [blocks]);

    return null;
}