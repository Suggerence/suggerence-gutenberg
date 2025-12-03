import { useCallback } from '@wordpress/element';
import { nanoid } from "nanoid";

import { useBlocksStore } from "@/apps/block-generator/stores/blocks";
import { useConversationsStore } from "@/apps/block-generator/stores/conversations";

export const useShadcnSearchItemsInRegistriesHandler = () =>
{
    const { blockId } = useBlocksStore();
    const { getConversation, addMessage } = useConversationsStore();

    return useCallback((data: { query: string }) =>
    {
        if (!blockId) return;

        const conversation = getConversation(blockId);
        if (!conversation) return;

        addMessage(blockId, { id: nanoid(), createdAt: new Date().toISOString(), type: 'tool_call', content: {
            name: 'shadcn/search_items_in_registries',
            arguments: { query: data.query },
            status: 'success'
        } });
    }, [blockId, getConversation, addMessage]);
}