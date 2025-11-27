import { useCallback } from '@wordpress/element';
import { nanoid } from "nanoid";
import { useQueryClient, useMutation } from "@tanstack/react-query";

import { updateBlockMutationOptions } from "@/shared/block-generation/mutation-options";
import { buildFileTreeFromArray } from "@/lib/block";

import { useBlocksStore } from "@/apps/block-generator/stores/blocks";
import { useConversationsStore } from "@/apps/block-generator/stores/conversations";

export const useWriteFileStartedHandler = () =>
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

        // Extract filename and extension from the path
        const pathParts = relativePath.split('/');
        const filename = pathParts[pathParts.length - 1];
        const filenameParts = filename.split('.');
        const extension = filenameParts.length > 1 ? filenameParts[filenameParts.length - 1] : '';

        addMessage(blockId, { id: nanoid(), createdAt: new Date().toISOString(), type: 'tool_call', content: {
            name: 'write_file',
            arguments: { path: relativePath, content: '' },
            status: 'pending'
        } });

        const newFile: GeneratedFile = {
            status: 'building',
            content: '',
            path: relativePath,
            filename,
            extension
        };

        const filesWithoutCurrent = (block.src_files ?? []).filter(file => file.path !== relativePath);
        const updatedSrcFiles = [...filesWithoutCurrent, newFile];
        const updatedBlock = { 
            ...block, 
            src_files: updatedSrcFiles, 
            file_tree: buildFileTreeFromArray(updatedSrcFiles),
            status: 'coding' as GeneratedBlockStatus 
        };

        // Optimistically update the cache immediately
        queryClient.setQueryData(['block', blockId], updatedBlock);

        updateBlock({ blockId, block: updatedBlock });

        setAiEditingFile(blockId, relativePath);
    }, [blockId, getConversation, addMessage, setAiEditingFile, queryClient, updateBlock]);
}