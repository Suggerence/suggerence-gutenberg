import { __ } from '@wordpress/i18n';
import { useCallback } from '@wordpress/element';
import { nanoid } from "nanoid";

import { useBlocksStore } from "@/apps/block-generator/stores/blocks";
import { useConversationsStore } from "@/apps/block-generator/stores/conversations";

export const useReadFileHandler = () =>
{
    const { blockId } = useBlocksStore();
    const { getConversation, addMessage } = useConversationsStore();

    return useCallback((data: { path: string, exists?: boolean }) =>
    {
        if (!blockId) return;

        const conversation = getConversation(blockId);
        if (!conversation) return;

        const status = data.exists === false ? 'error' : 'success';
        const result = data.exists === false ? { exists: false, message: __('File does not exist', 'suggerence-blocks') } : { exists: true, message: __('File found and read successfully', 'suggerence-blocks') };

        addMessage(blockId, { id: nanoid(), createdAt: new Date().toISOString(), type: 'tool_call', content: {
            name: 'read_file',
            arguments: { path: data.path },
            result: result,
            status: status
        } });
    }, [blockId, getConversation, addMessage]);
}