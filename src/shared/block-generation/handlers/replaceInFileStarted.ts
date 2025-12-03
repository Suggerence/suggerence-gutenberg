import { useCallback } from '@wordpress/element';
import { nanoid } from "nanoid";
import { useQueryClient, useMutation } from "@tanstack/react-query";

import { updateBlockMutationOptions } from "@/shared/block-generation/mutation-options";

import { useBlocksStore } from "@/apps/block-generator/stores/blocks";
import { useConversationsStore } from "@/apps/block-generator/stores/conversations";

export const useReplaceInFileStartedHandler = () =>
{
    const { blockId } = useBlocksStore();
    const { getConversation, addMessage, setAiEditingFile } = useConversationsStore();
    const queryClient = useQueryClient();
    const { mutate: updateBlock } = useMutation(updateBlockMutationOptions());

    return useCallback((data: { path: string }) =>
    {
        if (!blockId) return;

        const conversation = getConversation(blockId);
        if (!conversation) return;

        const block = queryClient.getQueryData<Partial<GeneratedBlock>>(['block', blockId]);
        if (!block) return;

        const blockPrefix = `blocks/${blockId}/`;
        const relativePath = data.path.startsWith(blockPrefix) ? './' + data.path.substring(blockPrefix.length) : data.path;

        addMessage(blockId, { id: nanoid(), createdAt: new Date().toISOString(), type: 'tool_call', content: {
            name: 'replace_in_file',
            arguments: { path: relativePath, old_content: '', new_content: '' },
            status: 'pending'
        } });

        const updatedFiles = (block.src_files ?? []).map(file => file.path === relativePath ? { ...file, status: 'building' as GeneratedFileStatus } : file);
        const updatedBlock = { ...block, src_files: updatedFiles, status: 'refining' as GeneratedBlockStatus };

        // Optimistically update the cache immediately
        queryClient.setQueryData(['block', blockId], updatedBlock);

        updateBlock({ blockId, block: updatedBlock });

        setAiEditingFile(blockId, relativePath.replace(/^\.\//, ''));
    }, [blockId, getConversation, addMessage, setAiEditingFile, queryClient, updateBlock]);
}