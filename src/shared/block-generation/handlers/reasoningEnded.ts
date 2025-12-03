import { useCallback } from '@wordpress/element';

import { useBlocksStore } from "@/apps/block-generator/stores/blocks";
import { useConversationsStore } from "@/apps/block-generator/stores/conversations";

export const useReasoningEndedHandler = () =>
{
    const { blockId } = useBlocksStore();
    const { getConversation, updateMessage } = useConversationsStore();
    
    return useCallback((data: unknown) =>
    {
        if (!blockId) return;

        const conversation = getConversation(blockId);
        if (!conversation) return;

        const lastMessage = conversation.messages[conversation.messages.length - 1];
        if (!lastMessage || lastMessage.type !== 'reasoning') return;

        updateMessage(blockId, lastMessage.id, { content: {streaming: false} });
    }, [blockId, getConversation, updateMessage]);
}