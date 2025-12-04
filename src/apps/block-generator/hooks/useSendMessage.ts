import { nanoid } from 'nanoid';
import { useCallback } from '@wordpress/element';
import { useQueryClient, useMutation } from '@tanstack/react-query';

import { storeBlockMutationOptions } from '@/shared/block-generation/mutation-options';

import { useBlocksStore } from '@/apps/block-generator/stores/blocks';
import { useConversationsStore } from '@/apps/block-generator/stores/conversations';
import { useWebsocketStore } from '@/apps/block-generator/stores/websocket';

export const useSendMessage = () =>
{
    const { blockId, setBlockId, selectedBlockId, setSelectedBlockId } = useBlocksStore();
    const { getConversation, addConversation, addMessage } = useConversationsStore();
    const { send: sendWebsocketMessage, connected } = useWebsocketStore();

    const queryClient = useQueryClient();

    const storeBlockMutation = useMutation({
        ...storeBlockMutationOptions(),
        onSuccess: () =>
        {
            queryClient.invalidateQueries({ queryKey: ['blocks'] });
        }
    });

    const sendMessage = useCallback(async (text: string) =>
    {
        const trimmedText = text.trim();
        if (!trimmedText || !connected) return;

        // Determine which block to use for generation
        // If there's already a block being generated, use it
        // Otherwise, use the selected block if available, or create a new one
        let currentBlockId = blockId;

        if (!currentBlockId) {
            // If no block is being generated, use selected block or create new
            if (selectedBlockId) {
                currentBlockId = selectedBlockId;
            } else {
                currentBlockId = crypto.randomUUID();

                const newBlock: Partial<GeneratedBlock> = {
                    id: currentBlockId,
                    description: trimmedText,
                    status: 'pending',
                    date: new Date().toISOString(),
                    parent_id: null
                };
                
                queryClient.setQueryData(['block', currentBlockId], newBlock);

                storeBlockMutation.mutate(newBlock);
            }

            // Set both blockId (for generation) and selectedBlockId (for display)
            setBlockId(currentBlockId);
            setSelectedBlockId(currentBlockId);
        }

        // Obtain or create conversation
        let conversation = getConversation(currentBlockId);
        
        if (!conversation) {
            addConversation(currentBlockId);
            conversation = getConversation(currentBlockId);
        }

        // Add message to conversation
        const userMessage: TextMessage = {
            id: nanoid(),
            createdAt: new Date().toISOString(),
            type: 'message',
            content: {
                text: trimmedText,
                context: conversation?.selectedFilePath ? { code: { path: conversation.selectedFilePath } } : undefined
            }
        }

        addMessage(currentBlockId, userMessage);

        // Send message via API
        sendWebsocketMessage('message', {
            blockId: currentBlockId,
            message: trimmedText,
            conversation: conversation?.messages || [],
            selectedFile: conversation?.selectedFilePath || null
        });
        
    }, [blockId, connected]);

    return { sendMessage };
}