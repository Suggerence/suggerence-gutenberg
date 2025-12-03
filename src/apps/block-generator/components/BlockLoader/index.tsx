import { __ } from '@wordpress/i18n';

import { Spinner } from '@/components/ui/spinner';

export const BlockLoader = () =>
{
    return (
        <div className="flex items-center justify-center h-full w-full">
            <div className="flex flex-col items-center gap-8">
                <Spinner className="size-32 dark:text-neutral-400!" />
                <h1 className="dark:text-neutral-400! text-2xl! font-bold animate-pulse">{__('Loading blocks...', 'suggerence-blocks')}</h1>
            </div>
        </div>
    );
}