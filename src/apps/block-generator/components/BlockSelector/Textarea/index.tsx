import { forwardRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Icon } from '@wordpress/components';
import { arrowUp } from '@wordpress/icons';

import { useBlocksStore } from '@/apps/block-generator/stores/blocks';
import { useWebsocketStore } from '@/apps/block-generator/stores/websocket';
import { useSendMessage } from '@/apps/block-generator/hooks/useSendMessage';

import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';

export const BlockSelectorTextarea = forwardRef<HTMLTextAreaElement>((props, ref) =>
{
    const [value, setValue] = useState('');
    const { blockId } = useBlocksStore();
    const { sendMessage } = useSendMessage();
    const { connected } = useWebsocketStore();

    const handleSubmit = () =>
    {
        if (!value.trim() || !!blockId || !connected) return;

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
        <>
            {connected ? (
                <div className='w-full max-w-2xl mx-auto relative'>
                    <Textarea
                        id='block-selector-textarea'
                        ref={ref}
                        value={value}
                        onChange={(event) => setValue(event.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={!!blockId ? __('A block is being generated...', 'suggerence-blocks') : __('Describe the block you want to create...', 'suggerence-blocks')}
                        rows={6}
                        disabled={!!blockId || !connected}
                        className='min-h-40! rounded-2xl! p-4! pr-16! resize-none! border-block-generation-input! placeholder:text-block-generation-muted-foreground! focus-visible:border-block-generation-primary! focus-visible:ring-block-generation-primary! aria-invalid:ring-block-generation-destructive/20! dark:aria-invalid:ring-block-generation-destructive/40! aria-invalid:border-block-generation-destructive! bg-block-generation-input! text-block-generation-foreground!'
                    />

                    <Button
                        variant='block-generation-primary'
                        onClick={handleSubmit}
                        disabled={!value.trim() || !!blockId || !connected}
                        size='icon-lg'
                        className='absolute top-4 right-4 rounded-full! cursor-pointer! disabled:cursor-not-allowed! z-10'
                    >
                        <Icon icon={arrowUp} fill='currentColor' className='size-6' />
                    </Button>
                </div>
            ) : (
                <div className='w-full max-w-2xl mx-auto'>
                    <div className='flex items-center justify-center gap-2'>
                        <Spinner />
                        <p className='text-base! text-block-generation-primary!'>{__('Connecting to Suggie...', 'suggerence-blocks')}</p>
                    </div>
                </div>
            )}
        </>
    );
});