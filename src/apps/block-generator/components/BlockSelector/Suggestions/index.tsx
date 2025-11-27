import { __ } from '@wordpress/i18n';

import { useSendMessage } from '@/apps/block-generator/hooks/useSendMessage';

import Suggestions from '@/apps/block-generator/constants/suggestions';
import { BlockSelectorBlock } from '@/apps/block-generator/components/BlockSelector/Block';

export const BlockSelectorSuggestions = () =>
{
    const { sendMessage } = useSendMessage();

    const handleClick = (suggestion: BlockSuggestion) =>
    {
        sendMessage(suggestion.description);
    }

    return (
        <>
            <p className="text-lg! font-bold mt-0! mb-2!">{__('Suggestions', 'suggerence-blocks')}</p>
            <div className='grid gap-4 grid-cols-2'>
                {
                    Suggestions.map((suggestion) => (
                        <BlockSelectorBlock key={suggestion.title} {...suggestion} generating={false} onClick={() => handleClick(suggestion)} />
                    ))
                }
            </div>
        </>
    )
}