import { useState } from '@wordpress/element';
import { Button } from '@wordpress/components';
import { blockDefault } from '@wordpress/icons';
import { useQuery } from '@tanstack/react-query';

import { getBlocksQueryOptions } from '@/shared/block-generation/query-options';

import { useBlocksStore } from '@/apps/block-generator/stores/blocks';
import { useWebsocketStore } from '@/apps/block-generator/stores/websocket';

import { Dialog, DialogTrigger, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ThemeSwitch } from '@/apps/block-generator/components/ThemeSwitch';
import { BlockLoader } from '@/apps/block-generator/components/BlockLoader';
import { BlockSelector } from '@/apps/block-generator/components/BlockSelector';
import { BlockEditor } from '@/apps/block-generator/components/BlockEditor';

export const Main = () =>
{
    const [isOpen, setIsOpen] = useState(false);
    const { selectedBlockId, blockId } = useBlocksStore();
    const { connect, disconnect } = useWebsocketStore();

    // Refetch blocks periodically when a block is being generated (and we're on the main screen)
    const { data: blocks = [], isLoading: isLoadingBlocks, error } = useQuery({
        ...getBlocksQueryOptions(),
        refetchInterval: blockId && !selectedBlockId ? 1000 : false
    });

    const handleOpenChange = (open: boolean) =>
    {
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
                <Button icon={blockDefault}></Button>
            </DialogTrigger>

            <DialogContent className='size-full max-w-[calc(100%-4rem)]! max-h-[calc(100%-4rem)]! p-0! border-none! flex! flex-col! overflow-hidden! block-generator-dialog dark:text-white! font-[sans-serif]!'>
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