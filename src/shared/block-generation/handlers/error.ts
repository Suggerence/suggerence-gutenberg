import { useCallback } from '@wordpress/element';
import { nanoid } from "nanoid";

import { useBlocksStore } from "@/apps/block-generator/stores/blocks";
import { useConversationsStore } from "@/apps/block-generator/stores/conversations";

export const useErrorHandler = () =>
{
    const { blockId, setBlockId } = useBlocksStore();
    const { getConversation, addMessage } = useConversationsStore();

    return useCallback((data: { type: 'error', message: string, code: string, data: unknown }) =>
    {
        if (!blockId) return;

        const conversation = getConversation(blockId);
        if (!conversation) return;

        setBlockId(undefined);

        return addMessage(blockId, { id: nanoid(), createdAt: new Date().toISOString(), type: 'error', content: {
            text: `Oops, it seems I run into an error: ${data.message}`,
        } });
    }, [blockId, setBlockId, getConversation, addMessage]);
}