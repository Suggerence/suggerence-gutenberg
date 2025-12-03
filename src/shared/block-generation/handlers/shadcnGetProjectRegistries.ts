import { useCallback } from '@wordpress/element';
import { nanoid } from "nanoid";

import { useBlocksStore } from "@/apps/block-generator/stores/blocks";
import { useConversationsStore } from "@/apps/block-generator/stores/conversations";

export const useShadcnGetProjectRegistriesHandler = () =>
{
    const { blockId } = useBlocksStore();
    const { getConversation, addMessage } = useConversationsStore();

    return useCallback((data: { success: boolean, registries: string[] }) =>
    {
        if (!blockId) return;

        const conversation = getConversation(blockId);
        if (!conversation) return;

        addMessage(blockId, { id: nanoid(), createdAt: new Date().toISOString(), type: 'tool_call', content: {
            name: 'shadcn/get_project_registries',
            arguments: { registries: data.registries },
            status: data.success ? 'success' : 'error'
        } });
    }, [blockId, getConversation, addMessage]);
}