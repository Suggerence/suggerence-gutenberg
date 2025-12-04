import { useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

import { SuggerenceLogo } from '@/apps/block-generator/components/SuggerenceLogo';
import { BlockSelectorTextarea } from '@/apps/block-generator/components/BlockSelector/Textarea';
import { BlockSelectorSuggestions } from '@/apps/block-generator/components/BlockSelector/Suggestions';
import { BlockSelectorCollection } from '@/apps/block-generator/components/BlockSelector/Collection';

interface BlockSelectorProps
{
    blocks: Partial<GeneratedBlock>[];
}

export const BlockSelector = ({ blocks }: BlockSelectorProps) =>
{
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    return (
        <div className='size-full p-10 flex flex-col items-center justify-center gap-10 relative'>
            <p className="absolute top-4 left-4 text-sm! m-0! text-block-generation-primary! bg-block-generation-muted! rounded-full! px-3! py-1!">
                {__('Experimental Beta', 'suggerence-blocks')}
            </p>

            <SuggerenceLogo className='max-w-40 absolute top-10' />

            <div className='text-center!'>
                <h1 className='text-4xl! text-block-generation-primary! font-bold m-0!'>{__('Unblock your creativity', 'suggerence-blocks')}</h1>
                <p className='text-base! text-block-generation-muted-foreground! m-0!'>{__('Describe a block and Suggie will generate it for you', 'suggerence-blocks')}</p>
            </div>

            <BlockSelectorTextarea ref={textareaRef} />

            <div className='w-full max-w-2xl mx-auto max-h-64 overflow-y-auto'>
                {blocks.length > 0 ?
                    <BlockSelectorCollection blocks={blocks} /> :
                    // <BlockSelectorSuggestions /> Removed suggestions for now
                    null
                }
            </div>
        </div>
    );
}