import { useState } from '@wordpress/element';
import { Button } from '@wordpress/components';
import { Button as ButtonUI } from '@/components/ui/button';
import { blockDefault } from '@wordpress/icons';
import { useQuery } from '@tanstack/react-query';
import { XIcon } from 'lucide-react';

import { getBlocksQueryOptions } from '@/shared/block-generation/query-options';

import { useBlocksStore } from '@/apps/block-generator/stores/blocks';
import { useWebsocketStore } from '@/apps/block-generator/stores/websocket';

import { SparklesText } from '@/components/ui/sparkles-text';
import { Dialog, DialogTrigger, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ThemeSwitch } from '@/apps/block-generator/components/ThemeSwitch';
import { BlockLoader } from '@/apps/block-generator/components/BlockLoader';
import { BlockSelector } from '@/apps/block-generator/components/BlockSelector';
import { BlockEditor } from '@/apps/block-generator/components/BlockEditor';

export const Main = () => {
    const [isOpen, setIsOpen] = useState(false);
    const { selectedBlockId, blockId } = useBlocksStore();
    const { connect, disconnect } = useWebsocketStore();

    // Refetch blocks periodically when a block is being generated (and we're on the main screen)
    const { data: blocks = [], isLoading: isLoadingBlocks, error } = useQuery({
        ...getBlocksQueryOptions(),
        refetchInterval: blockId && !selectedBlockId ? 1000 : false
    });

    const handleOpenChange = (open: boolean) => {
        setIsOpen(open);
        if (open) {
            connect();
        } else {
            disconnect();
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                <SparklesText sparklesCount={10}>
                    <Button className='bg-primary! text-white!' icon={blockDefault} />
                </SparklesText>
            </DialogTrigger>

            <DialogContent className='size-full max-w-[calc(100%-4rem)]! max-h-[calc(100%-4rem)]! p-0! border-none! flex! flex-col! overflow-hidden! block-generator-dialog dark:text-white! font-[sans-serif]! bg-block-generation-background! text-block-generation-foreground!'>
                <ButtonUI variant='ghost' className='absolute z-10 top-4! right-4! size-8! p-0! text-block-generation-foreground! hover:text-block-generation-accent-foreground! dark:hover:text-block-generation-accent-foreground! cursor-pointer!' onClick={() => setIsOpen(false)}>
                    <XIcon className='size-6' />
                </ButtonUI>

                <DialogTitle className='sr-only!'>Block Generator</DialogTitle>
                <DialogDescription className='sr-only!'>Unblock your creativity</DialogDescription>

                <ThemeSwitch className={selectedBlockId ? 'hidden' : ''} />

                {isLoadingBlocks ? (
                    <BlockLoader />
                ) : (
                    selectedBlockId ? <BlockEditor onCloseModal={() => setIsOpen(false)} /> : <BlockSelector blocks={blocks} />
                )}
            </DialogContent>
        </Dialog>
    );
}