import { __ } from "@wordpress/i18n";
import { useState } from "@wordpress/element";
import { plus } from "@wordpress/icons";
import { Button } from "@wordpress/components";
import { createBlock } from "@wordpress/blocks";
import { useQuery } from "@tanstack/react-query";

import { getBlockQueryOptions } from "@/shared/block-generation/query-options";

import { useBlocksStore } from '@/apps/block-generator/stores/blocks';

import { usePreviewStore } from '@/apps/block-generator/stores/preview';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogClose, DialogFooter } from "@/components/ui/dialog";
import { Button as ButtonUI } from "@/components/ui/button";

import { getBlockFile, loadBlockStyle } from "@/lib/block";

interface BlockEditorHeaderAddBlockButtonProps
{
    onCloseModal?: () => void;
}

export const BlockEditorHeaderAddBlockButton = ({ onCloseModal }: BlockEditorHeaderAddBlockButtonProps) =>
{
    const [isAdding, setIsAdding] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const { selectedBlockId } = useBlocksStore();
    const { blocks } = usePreviewStore();

    const { data: block } = useQuery(getBlockQueryOptions(selectedBlockId ?? ''));

    const handleAddBlock = async () =>
    {
        if (!blocks.length || !block?.slug) return;

        setIsAdding(true);

        try {
            if (block) {
                const editorStyles = await getBlockFile(block, './build/index.css');
                if (editorStyles.success) {
                    await loadBlockStyle(block, editorStyles.data?.content ?? '', 'editor');
                }

                const frontendStyles = await getBlockFile(block, './build/style-index.css');
                if (frontendStyles.success) {
                    await loadBlockStyle(block, frontendStyles.data?.content ?? '', 'view');
                }
            }

            const wp = (window as any).wp;
            if (!wp?.data) {
                console.error('WordPress data API is not available');
                setIsAdding(false);
                return;
            }

            const previewBlock = blocks[0];
            if (!previewBlock) {
                console.error('No block to add');
                setIsAdding(false);
                return;
            }

            const blockAttributes = previewBlock.attributes || {};

            const newBlock = createBlock(`suggerence/${block?.slug || block?.id || 'unknown'}`, blockAttributes);

            const mainEditorSelectors = wp.data.select('core/block-editor');
            const mainEditorDispatch = wp.data.dispatch('core/block-editor');

            const rootClientId = undefined;
            const allBlocks = mainEditorSelectors.getBlocks(rootClientId);

            const selectedClientId = mainEditorSelectors.getSelectedBlockClientId();

            let insertIndex = allBlocks.length;
            if (selectedClientId) {
                const selectedIndex = allBlocks.findIndex((block: any) => block.clientId === selectedClientId);
                if (selectedIndex >= 0) insertIndex = selectedIndex + 1;
            }

            mainEditorDispatch.insertBlock(newBlock, insertIndex, rootClientId, false);

            setTimeout(() => 
            {
                mainEditorDispatch.selectBlock(newBlock.clientId);
                setIsAdding(false);
                setIsDialogOpen(false);
                onCloseModal?.();
            }, 100);
        }
        catch (error) {
            console.error('Error adding block to editor:', error);
            setIsAdding(false);
        }
    };

    return (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
                <Button 
                    variant="primary" 
                    icon={plus} 
                    disabled={isAdding || !blocks.length} 
                    className="justify-center" 
                    isBusy={isAdding} 
                >
                    { isAdding ? __('Adding block...', 'suggerence-blocks') : __('Add this block to the editor', 'suggerence-blocks') }
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-block-generation-background! text-block-generation-foreground! border-block-generation-border! gap-0!">
                <DialogHeader className="border-0!">
                    <DialogTitle className="text-block-generation-foreground!">{__('Add block to editor', 'suggerence-blocks')}</DialogTitle>
                    <DialogDescription className="text-block-generation-muted-foreground!">
                        {__('We recommend testing the block in the preview before adding it to your post. This ensures the block works correctly with your content.', 'suggerence-blocks')}
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="border-0!">
                    <DialogClose asChild>
                        <ButtonUI variant="outline" className="border-block-generation-border! text-block-generation-foreground! hover:bg-block-generation-muted! hover:text-block-generation-foreground! cursor-pointer!">
                            {__('Cancel', 'suggerence-blocks')}
                        </ButtonUI>
                    </DialogClose>
                    <ButtonUI 
                        type="button"
                        onClick={handleAddBlock}
                        disabled={isAdding || !blocks.length}
                        variant="block-generation-primary"
                        className="cursor-pointer!"
                    >
                        { isAdding ? __('Adding block...', 'suggerence-blocks') : __('Add my block', 'suggerence-blocks') }
                    </ButtonUI>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}