import { useCallback } from '@wordpress/element';
import { useQueryClient, useMutation } from "@tanstack/react-query";

import { updateBlockMutationOptions } from "@/shared/block-generation/mutation-options";
import { buildFileTreeFromArray } from "@/lib/block";

import { useBlocksStore } from "@/apps/block-generator/stores/blocks";
import { useConversationsStore } from "@/apps/block-generator/stores/conversations";

export const useWriteFileEndedHandler = () =>
{
    const { blockId } = useBlocksStore();
    const { getConversation, updateMessage, setAiEditingFile, setStreamedCode, incrementTotalLinesWritten } = useConversationsStore();
    const queryClient = useQueryClient();
    const { mutate: updateBlock } = useMutation(updateBlockMutationOptions());

    return useCallback((data: { path: string, appendLines?: boolean }) =>
    {
        if (!blockId) return;

        const conversation = getConversation(blockId);
        if (!conversation) return;

        const block = queryClient.getQueryData<Partial<GeneratedBlock>>(['block', blockId]);
        if (!block) return;

        const lastMessage = conversation.messages[conversation.messages.length - 1];
        if (!lastMessage || lastMessage.type !== 'tool_call' || lastMessage.content.name !== 'write_file') return;
        
        updateMessage(blockId, lastMessage.id, { content: { ...lastMessage.content, status: 'success' } });

        const path = lastMessage.content.arguments.path;
        if (!path) return;
        
        // Get content from message arguments or from the file in block
        const content = lastMessage.content.arguments.content || (block.src_files ?? []).find(file => file.path === path)?.content;
        
        // Count lines in the written file
        if (content) {
            const lines = content.split('\n').length;
            incrementTotalLinesWritten(blockId, lines);
        }
        
        const updatedFiles = (block.src_files ?? []).map(file => file.path === path ? { ...file, status: 'completed' as GeneratedFileStatus } : file);
        const updatedBlock = { 
            ...block, 
            src_files: updatedFiles,
            file_tree: buildFileTreeFromArray(updatedFiles)
        };

        // Optimistically update the cache immediately
        queryClient.setQueryData(['block', blockId], updatedBlock);

        updateBlock({ blockId, block: updatedBlock });

        setAiEditingFile(blockId, null);
        setStreamedCode(blockId, (conversation.streamedCode ?? '') + (data.appendLines ? '\n\n' : ''));
    }, [blockId, getConversation, updateMessage, setAiEditingFile, setStreamedCode, incrementTotalLinesWritten, queryClient, updateBlock]);
}