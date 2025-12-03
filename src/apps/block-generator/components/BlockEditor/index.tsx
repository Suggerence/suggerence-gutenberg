import { useState } from '@wordpress/element';
import { useQuery } from '@tanstack/react-query';

import { getBlockQueryOptions } from '@/shared/block-generation/query-options';

import { useBlocksStore } from '@/apps/block-generator/stores/blocks';

import { Tabs, TabsContent } from '@/components/ui/tabs';

import { BlockEditorHeader } from '@/apps/block-generator/components/BlockEditor/Header';
import { BlockEditorChat } from '@/apps/block-generator/components/BlockEditor/Chat';
import { BlockEditorCode } from '@/apps/block-generator/components/BlockEditor/Code';
import { BlockEditorPreview } from '@/apps/block-generator/components/BlockEditor/Preview';
import { BlockEditorLoader } from '@/apps/block-generator/components/BlockEditor/Loader';
import { BlockEditorStateLoader } from '@/apps/block-generator/components/BlockEditor/StateLoader';

interface BlockEditorProps
{
    onCloseModal?: () => void;
}

export const BlockEditor = ({ onCloseModal }: BlockEditorProps) =>
{
    const [activeTab, setActiveTab] = useState<string>('preview');

    const { selectedBlockId } = useBlocksStore();
    const { data: block } = useQuery(getBlockQueryOptions(selectedBlockId ?? ''));
    
    return (
        <Tabs value={activeTab} onValueChange={setActiveTab} className='gap-0 size-full flex flex-col'>
            <BlockEditorHeader activeTab={activeTab} onCloseModal={onCloseModal} />

            <div className='size-full flex flex-1 min-h-0'>
                <TabsContent value='preview' className='grow min-w-0'>
                    {block?.status === 'completed' ? <BlockEditorPreview /> : <BlockEditorLoader />}
                </TabsContent>

                <TabsContent value='code' className='grow min-w-0 relative'>
                    <BlockEditorCode />

                    {block?.status === 'completed' ? null : <BlockEditorStateLoader />}
                </TabsContent>

                <BlockEditorChat />
            </div>
        </Tabs>
    );
}