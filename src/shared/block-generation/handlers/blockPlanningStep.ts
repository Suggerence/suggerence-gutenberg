import { useCallback } from '@wordpress/element';
import { useQueryClient, useMutation } from "@tanstack/react-query";

import { updateBlockMutationOptions } from "@/shared/block-generation/mutation-options";

import { useBlocksStore } from "@/apps/block-generator/stores/blocks"
import { useConversationsStore } from "@/apps/block-generator/stores/conversations"

export const useBlockPlanningStepHandler = () =>
{
    const { blockId } = useBlocksStore();
    const { getConversation, updateMessage } = useConversationsStore();
    const queryClient = useQueryClient();
    const { mutate: updateBlock } = useMutation(updateBlockMutationOptions());

    return useCallback((data: { title?: string, icon?: string, slug?: string, attributes?: GutenbergAttributes }) =>
    {
        if (!blockId) return;

        const conversation = getConversation(blockId);
        if (!conversation) return;
        
        const block = queryClient.getQueryData<Partial<GeneratedBlock>>(['block', blockId]);
        if (!block) return;

        const updatedBlock = {
            ...block,
            title: data.title || block.title || undefined,
            icon: data.icon || block.icon || undefined,
            slug: data.slug || block.slug || undefined,
            attributes: data.attributes || block.attributes || undefined
        };

        // Optimistically update the cache immediately
        queryClient.setQueryData(['block', blockId], updatedBlock);

        // Find the last block_planning message
        const planningMessage = [...conversation.messages].reverse().find(
            msg => msg.type === 'block_planning'
        );
        if (planningMessage) {
            updateMessage(blockId, planningMessage.id, { content: {
                title: data.title || block.title || undefined,
                icon: data.icon || block.icon || undefined,
                attributes: data.attributes || block.attributes || undefined,
            } });
        }

        updateBlock({ blockId, block: updatedBlock });
    }, [blockId, getConversation, updateMessage, queryClient, updateBlock]);
}