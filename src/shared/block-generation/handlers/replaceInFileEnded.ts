import { useCallback } from '@wordpress/element';
import { useQueryClient, useMutation } from "@tanstack/react-query";

import { updateBlockMutationOptions } from "@/shared/block-generation/mutation-options";
import { buildFileTreeFromArray } from "@/lib/block";

import { useBlocksStore } from "@/apps/block-generator/stores/blocks";
import { useConversationsStore } from "@/apps/block-generator/stores/conversations";

export const useReplaceInFileEndedHandler = () =>
{
    const { blockId } = useBlocksStore();
    const { getConversation, updateMessage, setAiEditingFile, setStreamedCode, incrementTotalLinesWritten } = useConversationsStore();
    const queryClient = useQueryClient();
    const { mutate: updateBlock } = useMutation(updateBlockMutationOptions());

    return useCallback((data: { path: string, result?: { sizeDiff: number, oldLength: number, newLength: number } }) =>
    {
        if (!blockId) return;

        const conversation = getConversation(blockId);
        if (!conversation) return;

        const block = queryClient.getQueryData<Partial<GeneratedBlock>>(['block', blockId]);
        if (!block) return;

        const lastMessage = conversation.messages[conversation.messages.length - 1];
        if (!lastMessage || lastMessage.type !== 'tool_call' || lastMessage.content.name !== 'replace_in_file') return;

        updateMessage(blockId, lastMessage.id, { content: {
            ...lastMessage.content,
            status: 'success',
            result: data.result
        } });

        const path = lastMessage.content.arguments.path;
        if (!path) return;

        // Get old and new content from message arguments to calculate line difference
        // Note: The file in block.src_files already has the new content (updated by replaceInFile handler)
        const oldContent = lastMessage.content.arguments.old_content || '';
        const newContent = lastMessage.content.arguments.new_content || (block.src_files ?? []).find(file => file.path === path)?.content || '';
        
        const oldLines = oldContent ? oldContent.split('\n').length : 0;
        const newLines = newContent ? newContent.split('\n').length : 0;
        
        // Count the net change in lines (new lines - old lines)
        const lineDiff = newLines - oldLines;
        if (lineDiff > 0) {
            incrementTotalLinesWritten(blockId, lineDiff);
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
        setStreamedCode(blockId, (conversation.streamedCode ?? '') + '\n\n');
    }, [blockId, getConversation, updateMessage, setAiEditingFile, setStreamedCode, incrementTotalLinesWritten, queryClient, updateBlock]);
}