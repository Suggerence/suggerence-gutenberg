import { __ } from '@wordpress/i18n';
import { useQueryClient, useMutation } from '@tanstack/react-query';

import { useBlocksStore } from '@/apps/block-generator/stores/blocks';
import { useConversationsStore } from '@/apps/block-generator/stores/conversations';

import { deleteBlockMutationOptions } from '@/shared/block-generation/mutation-options';

import { BlockSelectorBlock } from '@/apps/block-generator/components/BlockSelector/Block';
interface BlockSelectorCollectionProps
{
    blocks: Partial<GeneratedBlock>[];
}

export const BlockSelectorCollection = ({ blocks }: BlockSelectorCollectionProps) =>
{
    const { blockId, setBlockId, selectedBlockId, setSelectedBlockId } = useBlocksStore();
    const { deleteConversation } = useConversationsStore();

    const queryClient = useQueryClient();

    const deleteBlockMutation = useMutation({
        ...deleteBlockMutationOptions(),
        onSuccess: () =>
        {
            queryClient.invalidateQueries({ queryKey: ['blocks'] });
        }
    });

    const sortedBlocks = [...blocks].sort((a, b) =>
    {
        const dateA = a.date ? new Date(a.date).getTime() : 0;
        const dateB = b.date ? new Date(b.date).getTime() : 0;
        return dateB - dateA;
    });

    const handleBlockClick = (blockId: string | undefined) =>
    {
        setSelectedBlockId(blockId);
    }

    const handleBlockDelete = (blockIdToDelete: string | undefined) =>
    {
        if (confirm(__('Are you sure you want to delete this block?', 'suggerence-blocks'))) {
            deleteBlockMutation.mutate(blockIdToDelete || '');
            deleteConversation(blockIdToDelete || '');
            
            // Reset blockId if the deleted block is the one being generated
            if (blockIdToDelete && blockIdToDelete === blockId) {
                setBlockId(undefined);
            }
            
            // Reset selectedBlockId if the deleted block is the one currently selected
            if (blockIdToDelete && blockIdToDelete === selectedBlockId) {
                setSelectedBlockId(undefined);
            }
        }
    }

    return (
        <>
            <p className="text-lg! font-bold mt-0!">{__('My Collection', 'suggerence-blocks')}</p>

            <div className='grid gap-4 grid-cols-2'>
                {
                    sortedBlocks.map((block) => (
                        <BlockSelectorBlock
                            key={block.id}
                            title={block.title}
                            description={block.description}
                            icon={block.icon}
                            status={block.status}
                            generating={!['completed', 'failed'].includes(block.status || '')}
                            onClick={() => handleBlockClick(block.id)}
                            onDelete={() => handleBlockDelete(block.id)}
                        />
                    ))
                }
            </div>
        </>
    );
}