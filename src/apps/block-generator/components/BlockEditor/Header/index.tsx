import { __ } from "@wordpress/i18n";
import { useQuery } from "@tanstack/react-query";
import { Icon, Dashicon } from '@wordpress/components';
import { arrowLeft, seen, code } from '@wordpress/icons';

import { getBlockQueryOptions } from "@/shared/block-generation/query-options";

import { useBlocksStore } from '@/apps/block-generator/stores/blocks';

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";

import { BlockEditorHeaderAddBlockButton } from '@/apps/block-generator/components/BlockEditor/Header/AddBlockButton';
import { BlockEditorHeaderRebuildButton } from '@/apps/block-generator/components/BlockEditor/Header/RebuildButton';

interface BlockEditorHeaderProps
{
    activeTab: string;
    onCloseModal?: () => void;
}

export const BlockEditorHeader = ({ activeTab, onCloseModal }: BlockEditorHeaderProps) =>
{
    const { selectedBlockId, setSelectedBlockId } = useBlocksStore();

    const { data: block } = useQuery(getBlockQueryOptions(selectedBlockId ?? ''));

    const handleBackClick = () =>
    {
        setSelectedBlockId(undefined);
    };

    const isSyncing = activeTab === 'code' && block?.src_files?.some(file => file.status === 'syncing');
    const showSynced = activeTab === 'code' && block?.src_files && block?.src_files.length > 0 && !isSyncing;

    return (
        <div className="w-full flex items-center justify-between box-border border-b border-block-generation-border pr-12">
            <div className="flex items-center gap-4">
                <Button variant='ghost' size='icon' className="cursor-pointer" onClick={handleBackClick} title={__('Back to collection', 'suggerence-blocks')}>
                    <Icon icon={arrowLeft} fill='currentColor' className='size-6' />
                </Button>

                <div className="py-2 box-content flex items-center justify-center min-w-[60px]">
                    {
                        block?.icon ? (
                            <Dashicon icon={block.icon as any} size={48} />
                        ) : (
                            <span className="size-12 bg-block-generation-muted-foreground animate-pulse rounded block"></span>
                        )
                    }
                </div>

                <div>
                    {
                        block?.title ? (
                            <p className="m-0! text-lg font-bold">{block.title}</p>
                        ) : (
                            <span className="h-5 w-40 bg-block-generation-muted-foreground animate-pulse rounded block"></span>
                        )
                    }

                    <p className="m-0! text-sm">{block?.description}</p>
                </div>
            </div>

            <div className="flex items-center gap-4">
                {
                    activeTab === 'preview' && block?.status === 'completed' && (
                        <BlockEditorHeaderAddBlockButton onCloseModal={onCloseModal} />
                    )
                }

                {
                    activeTab === 'code' && block?.status === 'completed' && (
                        <BlockEditorHeaderRebuildButton />
                    )
                }
                
                {
                    isSyncing && (
                        <div className="flex items-center gap-2 text-sm text-block-generation-muted-foreground">
                            <Spinner className="size-4" />
                            <span>{__('Syncing...', 'suggerence-blocks')}</span>
                        </div>
                    )
                }

                {
                    showSynced && (
                        <div className="flex items-center gap-2 text-sm text-block-generation-muted-foreground">
                            <Dashicon icon='cloud-saved' size={16} />
                            <span>{__('Synced', 'suggerence-blocks')}</span>
                        </div>
                    )
                }

                <TabsList>
                    <TabsTrigger value="preview">
                        <Icon icon={seen} fill="currentColor" />
                        <span className="text-block-generation-primary">{__('Preview', 'suggerence-blocks')}</span>
                    </TabsTrigger>
                    <TabsTrigger value="code">
                        <Icon icon={code} fill="currentColor" />
                        <span className="text-block-generation-primary">{__('Code', 'suggerence-blocks')}</span>
                    </TabsTrigger>
                </TabsList>
            </div>
        </div>
    );
}