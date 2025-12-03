import { useCallback } from '@wordpress/element';
import { nanoid } from "nanoid";
import { useQueryClient, useMutation } from "@tanstack/react-query";

import { updateBlockMutationOptions } from "@/shared/block-generation/mutation-options";

import { loadBlockIntoEditor } from '@/lib/block';

import { useBlocksStore } from "@/apps/block-generator/stores/blocks";
import { useConversationsStore } from "@/apps/block-generator/stores/conversations";
import { useWebsocketStore } from "@/apps/block-generator/stores/websocket";

export const useLoadBlockHandler = () =>
{
    const { blockId } = useBlocksStore();
    const { getConversation, addMessage, updateMessage } = useConversationsStore();
    const { send: sendWebsocketMessage } = useWebsocketStore();
    const queryClient = useQueryClient();
    const { mutate: updateBlock } = useMutation(updateBlockMutationOptions());

    return useCallback(async (data: { blockId: string, requestId: string }) =>
    {
        if (!data.blockId) return;

        const conversation = getConversation(data.blockId);
        if (!conversation) return;

        const messageId = nanoid();
        addMessage(data.blockId, { id: messageId, createdAt: new Date().toISOString(), type: 'tool_call', content: {
            name: 'load_block',
            arguments: {},
            status: 'pending'
        } });

        // Wait for build files to be available in the store
        try {
            let blockToLoad = queryClient.getQueryData<Partial<GeneratedBlock>>(['block', data.blockId]);
            let retries = 0;
            const maxRetries = 20;
            const retryDelay = 50;

            const initialLastBuildTime = blockToLoad?.lastBuildTime ?? '';

            while (retries < maxRetries && blockToLoad) {
                const hasBuildFiles = blockToLoad.src_files?.some(file => file.status === 'completed' && file.path?.startsWith('./build/'));
                const currentLastBuildTime = blockToLoad.lastBuildTime;
                const buildJustCompleted = currentLastBuildTime && (!initialLastBuildTime || currentLastBuildTime !== initialLastBuildTime);

                if ((buildJustCompleted || currentLastBuildTime) && !hasBuildFiles) {
                    await new Promise(resolve => setTimeout(resolve, retryDelay));
                    blockToLoad = queryClient.getQueryData<Partial<GeneratedBlock>>(['block', data.blockId]);
                    retries++;
                } else {
                    break;
                }
            }

            // Ensure we have the latest block to load
            blockToLoad = queryClient.getQueryData<Partial<GeneratedBlock>>(['block', data.blockId]);

            // Call the callback to actually load the block
            const result = await loadBlockIntoEditor(blockToLoad ?? {});

            // Update the tool call message with success / error status
            updateMessage(data.blockId, messageId, { content: {
                name: 'load_block',
                arguments: {},
                status: result.success ? 'success' : 'error'
            } });

            // If load was successful, mark the block as completed
            if (result.success && blockToLoad) {
                const updatedBlock = {
                    ...blockToLoad,
                    status: 'completed' as GeneratedBlockStatus,
                    completed_at: new Date().toISOString()
                };

                // Optimistically update the cache immediately
                queryClient.setQueryData(['block', data.blockId], updatedBlock);

                updateBlock({ blockId: data.blockId, block: updatedBlock });
            }

            // Send the result to the websocket
            sendWebsocketMessage('response', {
                blockId: data.blockId,
                requestId: data.requestId,
                success: result.success,
                message: result.message
            });
        }
        catch (error) {
            updateMessage(data.blockId, messageId, { content: {
                name: 'load_block',
                arguments: {},
                status: 'error',
                error: error instanceof Error ? error.message : String(error ?? 'Unknown error')
            } });

            // Send the result to the websocket
            sendWebsocketMessage('response', {
                blockId: data.blockId,
                requestId: data.requestId,
                success: false,
                message: error instanceof Error ? error.message : String(error ?? 'Failed to load block')
            });
        }
    }, [getConversation, addMessage, updateMessage, sendWebsocketMessage, queryClient, updateBlock]);
}