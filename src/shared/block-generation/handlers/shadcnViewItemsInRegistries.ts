import { useCallback } from '@wordpress/element';
import { nanoid } from "nanoid";

import { useBlocksStore } from "@/apps/block-generator/stores/blocks";
import { useConversationsStore } from "@/apps/block-generator/stores/conversations";

export const useShadcnViewItemsInRegistriesHandler = () =>
{
    const { blockId } = useBlocksStore();
    const { getConversation, addMessage } = useConversationsStore();

    return useCallback((data: { items: string[] }) =>
    {
        if (!blockId) return;

        const conversation = getConversation(blockId);
        if (!conversation) return;

        addMessage(blockId, { id: nanoid(), createdAt: new Date().toISOString(), type: 'tool_call', content: {
            name: 'shadcn/view_items_in_registries',
            arguments: { items: data.items },
            status: 'success'
        } });
    }, [blockId, getConversation, addMessage]);
}