import { __ } from '@wordpress/i18n';
import { MessageCircleIcon } from 'lucide-react';

import { Conversation, ConversationContent, ConversationEmptyState, ConversationScrollButton } from '@/components/ai-elements/conversation'

import { useBlocksStore } from '@/apps/block-generator/stores/blocks';
import { useConversationsStore } from '@/apps/block-generator/stores/conversations';

import { BlockEditorChatConversationMessage } from '@/apps/block-generator/components/BlockEditor/Chat/Conversation/Message';

export const BlockEditorChatConversation = () =>
{
    const { blockId } = useBlocksStore();
    const { getConversation } = useConversationsStore();

    const conversation = getConversation(blockId ?? '');

    return (
        <Conversation className='w-full min-h-0'>
            <ConversationContent className='gap-2!'>
                {
                    !conversation || conversation.messages.length === 0 ? (
                        <ConversationEmptyState
                            icon={<MessageCircleIcon className='size-6' />}
                            title={__('No messages yet', 'suggerence-blocks')}
                            description={__('Start a conversation to get started', 'suggerence-blocks')}
                        />
                    ) : (
                        conversation.messages.map(message => <BlockEditorChatConversationMessage key={message.id} message={message} />)
                    )
                }
            </ConversationContent>
            <ConversationScrollButton />
        </Conversation>
    );
}