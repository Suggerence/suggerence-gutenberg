import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
import { ChatStatus } from 'ai';

import { useBlocksStore } from '@/apps/block-generator/stores/blocks';

import { PromptInput, PromptInputBody, PromptInputTextarea, PromptInputSubmit, type PromptInputMessage } from '@/components/ai-elements/block-generation-prompt-input';

interface BlockEditorChatInputProps {
    onSubmit: (message: PromptInputMessage) => void;
}

export const BlockEditorChatInput = ({ onSubmit }: BlockEditorChatInputProps) =>
{
    const [status, setStatus] = useState<ChatStatus>('ready');
    const { blockId } = useBlocksStore();

    const handleSubmit = (message: PromptInputMessage, event: React.FormEvent<HTMLFormElement>) =>
    {
        if (!!blockId) {
            event.preventDefault();
            return;
        }
        return onSubmit(message);
    };

    return (
        <div className='bg-block-generation-input'>
            <PromptInput onSubmit={handleSubmit} className='shrink-0'>
                <PromptInputBody>
                    <PromptInputTextarea
                        placeholder={!!blockId ? __('A block is being generated...', 'suggerence-blocks') : __('Ask me anything...', 'suggerence-blocks')} 
                        className='outline-none! ring-0! border-0! resize-none! p-2! bg-transparent! text-block-generation-foreground! placeholder:text-block-generation-muted-foreground!'
                        disabled={!!blockId}
                    />
                </PromptInputBody>

                <PromptInputSubmit variant='block-generation-primary' className='h-8! cursor-pointer! mr-2!' status={status} disabled={!!blockId} />
            </PromptInput>
        </div>
    )
}