import { useCallback } from '@wordpress/element';
import { nanoid } from "nanoid";

import { useConversationsStore } from "@/apps/block-generator/stores/conversations";
import { useBlocksStore } from "@/apps/block-generator/stores/blocks";

export const useReadProjectStructureHandler = () =>
{
    const { blockId } = useBlocksStore();
    const { getConversation, addMessage } = useConversationsStore();

    return useCallback((data: unknown) =>
    {
        if (!blockId) return;

        const conversation = getConversation(blockId);
        if (!conversation) return;

        addMessage(blockId, { id: nanoid(), createdAt: new Date().toISOString(), type: 'tool_call', content: {
            name: 'read_project_structure',
            arguments: {},
            status: 'success'
        } });
    }, [blockId, getConversation, addMessage]);
}