import { useCallback } from '@wordpress/element';
import { useQueryClient, useMutation } from "@tanstack/react-query";

import { updateBlockMutationOptions } from "@/shared/block-generation/mutation-options";
import { buildFileTreeFromArray } from "@/lib/block";

import { useBlocksStore } from "@/apps/block-generator/stores/blocks";
import { useConversationsStore } from "@/apps/block-generator/stores/conversations";

export const useWriteFileHandler = () =>
{
    const { blockId } = useBlocksStore();
    const { getConversation, updateMessage } = useConversationsStore();
    const queryClient = useQueryClient();
    const { mutate: updateBlock } = useMutation(updateBlockMutationOptions());

    return useCallback((data: { path: string, content: string }) =>
    {
        if (!blockId) return;

        const conversation = getConversation(blockId);
        if (!conversation) return;

        const block = queryClient.getQueryData<Partial<GeneratedBlock>>(['block', blockId]);
        if (!block) return;

        const lastMessage = conversation.messages[conversation.messages.length - 1];
        if (!lastMessage || lastMessage.type !== 'tool_call' || lastMessage.content.name !== 'write_file') return;
        
        const blockPrefix = `blocks/${blockId}/`;
        const relativePath = data.path.startsWith(blockPrefix) ? './' + data.path.substring(blockPrefix.length) : data.path;

        updateMessage(blockId, lastMessage.id, { content: {
            ...lastMessage.content,
            arguments: {
                path: relativePath,
                content: data.content
            }
        } });

        const updatedFiles = (block.src_files ?? []).map(file => file.path === relativePath ? { ...file, content: data.content } : file);
        const updatedBlock = { 
            ...block, 
            src_files: updatedFiles,
            file_tree: buildFileTreeFromArray(updatedFiles)
        };

        // Optimistically update the cache immediately
        queryClient.setQueryData(['block', blockId], updatedBlock);

        updateBlock({ blockId, block: updatedBlock });
    }, [blockId, getConversation, updateMessage, queryClient, updateBlock]);
}