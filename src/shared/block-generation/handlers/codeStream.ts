import { useCallback } from '@wordpress/element';

import { useBlocksStore } from "@/apps/block-generator/stores/blocks";
import { useConversationsStore } from "@/apps/block-generator/stores/conversations";

export const useCodeStreamHandler = () =>
{
    const { blockId } = useBlocksStore();
    const { getConversation, setStreamedCode } = useConversationsStore();

    return useCallback((data: { content: string }) =>
    {
        if (!blockId) return;

        const conversation = getConversation(blockId);
        if (!conversation) return;

        setStreamedCode(blockId, (conversation.streamedCode ?? '') + data.content);
    }, [blockId, getConversation, setStreamedCode]);
}