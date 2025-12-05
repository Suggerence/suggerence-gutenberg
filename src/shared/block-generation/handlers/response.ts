import { useCallback } from '@wordpress/element';
import { nanoid } from "nanoid";

import { useBlocksStore } from "@/apps/block-generator/stores/blocks";
import { useConversationsStore } from "@/apps/block-generator/stores/conversations";

export const useResponseHandler = () =>
{
    const { blockId } = useBlocksStore();
    const { getConversation, addMessage, updateMessage } = useConversationsStore();

    return useCallback((data: { chunk: string }) =>
    {
        if (!blockId) return;

        const conversation = getConversation(blockId);
        if (!conversation) return;
        
        const lastMessage = conversation.messages[conversation.messages.length - 1];
        if (!lastMessage || lastMessage.type !== 'response') {
            return addMessage(blockId, { id: nanoid(), createdAt: new Date().toISOString(), type: 'response', content: {
                text: data.chunk,
            } });
        }

        updateMessage(blockId, lastMessage.id, { content: {
            text: lastMessage.content.text + data.chunk,
        } });
    }, [blockId, getConversation, addMessage, updateMessage]);
}