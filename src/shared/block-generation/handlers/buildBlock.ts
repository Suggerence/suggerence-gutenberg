import { useCallback } from '@wordpress/element';
import { nanoid } from "nanoid";
import { useQueryClient, useMutation } from "@tanstack/react-query";

import { updateBlockMutationOptions } from "@/shared/block-generation/mutation-options";
import { buildFileTreeFromArray } from "@/lib/block";

import { useBlocksStore } from "@/apps/block-generator/stores/blocks"
import { useConversationsStore } from "@/apps/block-generator/stores/conversations"

export const useBuildBlockHandler = () =>
{
    const { blockId } = useBlocksStore();
    const { getConversation, addMessage, updateMessage } = useConversationsStore();
    const queryClient = useQueryClient();
    const { mutate: updateBlock } = useMutation(updateBlockMutationOptions());

    return useCallback((data: { status: 'building' | 'built', success: boolean, build_output?: string, error?: string, files?: Record<string, string> }) =>
    {
        if (!blockId) return;

        const block = queryClient.getQueryData<Partial<GeneratedBlock>>(['block', blockId]);
        if (!block) return;

        const conversation = getConversation(blockId);
        if (!conversation) return;

        if (data.status === 'building') {
            const messageId = nanoid();
            addMessage(blockId, { id: messageId, createdAt: new Date().toISOString(), type: 'tool_call', content: {
                name: 'build_block',
                arguments: {},
                status: 'pending'
            } });

            const updatedBlock = {
                ...block,
                status: 'building' as GeneratedBlockStatus
            };

            // Optimistically update the cache immediately
            queryClient.setQueryData(['block', blockId], updatedBlock);

            updateBlock({ blockId, block: updatedBlock });

            return;
        }

        // Find the last build_block tool_call message
        const buildBlockMessage = [...conversation.messages].reverse().find(
            msg => msg.type === 'tool_call' && msg.content?.name === 'build_block'
        );
        if (!buildBlockMessage) return;

        updateMessage(blockId, buildBlockMessage.id, { content: {
            name: 'build_block',
            arguments: {},
            result: {
                success: data.success,
                build_output: data.build_output,
                error: data.error
            },
            status: data.success ? 'success' : 'error'
        } });

        if (data.success && data.files) {
            const buildFiles: GeneratedFile[] = Object.entries(data.files).map(([path, content]) => {
                const filename = path.split('/').pop() ?? path;
                const extension = filename.split('.').pop() ?? '';

                return {
                    status: 'completed' as GeneratedFileStatus,
                    content,
                    path: `./build/${path}`,
                    filename,
                    extension
                };
            });

            const nonBuildFiles = block.src_files?.filter(f => {
                const filePath = f.path ?? f.filename;
                return !filePath.startsWith('./build/');
            }) ?? [];

            const sourceFileSnapshots: Record<string, string> = {};
            nonBuildFiles?.forEach(file => {
                const filePath = file.path ?? file.filename;

                if (filePath && file.content) {
                    sourceFileSnapshots[filePath] = file.content;
                }
            });

            const updatedSrcFiles = [...nonBuildFiles, ...buildFiles];
            const updatedBlock = {
                ...block,
                src_files: updatedSrcFiles,
                file_tree: buildFileTreeFromArray(updatedSrcFiles),
                lastBuildTime: new Date().toISOString(),
                lastBuildFileSnapshots: sourceFileSnapshots
            };

            // Optimistically update the cache immediately
            queryClient.setQueryData(['block', blockId], updatedBlock);

            updateBlock({
                blockId, block: updatedBlock
            });
        }
    }, [blockId, getConversation, addMessage, updateMessage, updateBlock, queryClient]);    
}