import { useQuery } from '@tanstack/react-query';

import { getBlockQueryOptions } from '@/shared/block-generation/query-options';
import { useBlocksStore } from '@/apps/block-generator/stores/blocks';

import { useSendMessage } from '@/apps/block-generator/hooks/useSendMessage';

import { type PromptInputMessage } from '@/components/ai-elements/prompt-input';
import { BlockEditorChatHeader } from '@/apps/block-generator/components/BlockEditor/Chat/Header';
import { BlockEditorChatConversation } from '@/apps/block-generator/components/BlockEditor/Chat/Conversation';
import { BlockEditorChatInput } from '@/apps/block-generator/components/BlockEditor/Chat/Input';

export const BlockEditorChat = () =>
{
    const { selectedBlockId } = useBlocksStore();
    const { data: block } = useQuery(getBlockQueryOptions(selectedBlockId ?? ''));
    const { sendMessage } = useSendMessage();

    const handleSubmit = (message: PromptInputMessage) =>
    {
        if (!selectedBlockId || !message.text?.trim()) return;

        sendMessage(message.text);
    }

    return (
        <div className="w-min lg:w-sm border-l border-border flex flex-col gap-2 overflow-hidden min-h-0">
            <BlockEditorChatHeader title={block?.title} />

            <BlockEditorChatConversation />

            <BlockEditorChatInput onSubmit={handleSubmit} />
        </div>
    );
}