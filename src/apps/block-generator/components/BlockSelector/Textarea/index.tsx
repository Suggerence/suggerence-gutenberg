import { forwardRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Icon } from '@wordpress/components';
import { arrowUp } from '@wordpress/icons';

import { useBlocksStore } from '@/apps/block-generator/stores/blocks';
import { useSendMessage } from '@/apps/block-generator/hooks/useSendMessage';

import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

export const BlockSelectorTextarea = forwardRef<HTMLTextAreaElement>((props, ref) =>
{
    const [value, setValue] = useState('');
    const { blockId } = useBlocksStore();
    const { sendMessage } = useSendMessage();

    const isGenerating = !!blockId;

    const handleSubmit = () =>
    {
        if (!value.trim() || isGenerating) return;

        sendMessage(value);

        setValue('');
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) =>
    {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            handleSubmit();
        }
    };

    return (
        <div className='w-full max-w-2xl mx-auto relative'>
            <Textarea
                id='block-selector-textarea'
                ref={ref}
                value={value}
                onChange={(event) => setValue(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={isGenerating ? __('A block is being generated...', 'suggerence-blocks') : __('Describe the block you want to create...', 'suggerence-blocks')}
                rows={6}
                disabled={isGenerating}
                className='min-h-40! rounded-2xl! p-4! pr-16! resize-none!'
            />

            <Button
                onClick={handleSubmit}
                disabled={!value.trim() || isGenerating}
                size='icon-lg'
                className='absolute top-4 right-4 rounded-full! cursor-pointer! disabled:cursor-not-allowed! z-10'
            >
                <Icon icon={arrowUp} fill='currentColor' className='size-6' />
            </Button>
        </div>
    );
});