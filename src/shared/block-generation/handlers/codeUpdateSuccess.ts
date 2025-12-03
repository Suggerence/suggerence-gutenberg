import { useCallback } from '@wordpress/element';
import { useQueryClient, useMutation } from "@tanstack/react-query";

import { updateBlockMutationOptions } from "@/shared/block-generation/mutation-options";

import { useBlocksStore } from "@/apps/block-generator/stores/blocks";

export const useCodeUpdateSuccessHandler = () =>
{
    const { blockId } = useBlocksStore();
    const queryClient = useQueryClient();
    const { mutate: updateBlock } = useMutation(updateBlockMutationOptions());

    return useCallback((data: { blockId: string, path: string }) =>
    {
        if (!blockId) return;

        const block = queryClient.getQueryData<Partial<GeneratedBlock>>(['block', blockId]);
        if (!block || !block.src_files) return;

        const blockPrefix = `blocks/${data.blockId}/`;
        const relativePath = data.path.startsWith(blockPrefix) ? './' + data.path.substring(blockPrefix.length) : data.path;
        const cleanPath = relativePath.replace(/^\.\//, '');

        const updatedFiles = block.src_files.map(file => 
        {
            const filePath = file.path ?? '';
            const cleanFilePath = filePath.replace(/^\.\//, '');

            if (cleanFilePath === cleanPath || file.filename === (cleanPath.split('/').pop() ?? '')) {
                return { ...file, status: 'completed' as GeneratedFileStatus }
            }

            return file;
        });

        const updatedBlock = { ...block, src_files: updatedFiles };

        // Optimistically update the cache immediately
        queryClient.setQueryData(['block', blockId], updatedBlock);

        updateBlock({ blockId, block: updatedBlock });
    }, [blockId, queryClient, updateBlock]);
}