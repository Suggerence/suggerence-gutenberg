import { useState, useEffect, useCallback, useMemo, useRef } from '@wordpress/element';
import { createBlock } from '@wordpress/blocks';
import { useQuery } from '@tanstack/react-query';

import { Tabs, TabsContent } from '@/components/ui/tabs';

import { getBlockQueryOptions } from '@/shared/block-generation/query-options';
import { useBlocksStore } from '@/apps/block-generator/stores/blocks';
import { usePreviewStore } from '@/apps/block-generator/stores/preview';

import { BlockEditorPreviewHeader } from '@/apps/block-generator/components/BlockEditor/Preview/Header';
import { BlockEditorPreviewEditor } from '@/apps/block-generator/components/BlockEditor/Preview/Editor';
import { BlockEditorPreviewFrontend } from '@/apps/block-generator/components/BlockEditor/Preview/Frontend';

export const BlockEditorPreview = () =>
{
    const [activeTab, setActiveTab] = useState<string>('preview');
    const [blocks, setBlocks] = useState<any[]>([]);
    const [isReady, setIsReady] = useState(false);
    const initializedBlockNameRef = useRef<string | null>(null);

    const { selectedBlockId } = useBlocksStore();
    const { setBlocks: setPreviewBlocks } = usePreviewStore();
    const { data: block } = useQuery(getBlockQueryOptions(selectedBlockId ?? ''));

    const blockName = `suggerence/${block?.slug || selectedBlockId || 'unknown'}`;
    
    // Memoize initialAttributes so it only changes when block.attributes actually changes
    const initialAttributes = useMemo(() => {
        return block?.attributes ? Object.entries(block.attributes).reduce((acc: Record<string, unknown>, [key, value]) =>
        {
            // Only include attributes with defined defaults - let WordPress use block.json defaults for others
            if (value.default !== undefined) {
                acc[key] = value.default;
            }
            return acc;
        }, {}) : {};
    }, [block?.attributes]);

    // Initialize blocks when blockName or initialAttributes change
    useEffect(() => {
        // Only initialize if blockName changed
        if (initializedBlockNameRef.current === blockName) {
            return;
        }

        const wp = (window as any).wp;

        const blockType = wp.blocks.getBlockType(blockName);
        if (!blockType) {
            console.warn(`Block "${blockName}" is not registered`);
            console.log('Available blocks:', wp.blocks.getBlockTypes().map((blockType: any) => blockType.name));
            setBlocks([]);
            setIsReady(false);
            return;
        }

        try {
            const blockInstance = createBlock(blockName, initialAttributes);
            setBlocks([blockInstance]);
            setIsReady(true);
            initializedBlockNameRef.current = blockName;
        }
        catch (error) {
            console.error('Error creating block:', error);
            setBlocks([]);
            setIsReady(false);
        }
    }, [blockName, initialAttributes]);

    const onInput = useCallback((newBlocks: any[]) => {
        setBlocks(newBlocks);
    }, []);

    const onChange = useCallback((newBlocks: any[]) => {
        setBlocks(newBlocks);
    }, []);

    // Sync blocks to store whenever they change
    useEffect(() => {
        setPreviewBlocks(blocks);
    }, [blocks, setPreviewBlocks]);

    return (
        <Tabs value={activeTab} onValueChange={setActiveTab} className='gap-0 size-full flex flex-col'>
            <BlockEditorPreviewHeader activeTab={activeTab} />

            <TabsContent value='preview' className='grow overflow-auto bg-white'>
                <BlockEditorPreviewEditor 
                    blocks={blocks} 
                    isReady={isReady}
                    onInput={onInput} 
                    onChange={onChange} 
                />
            </TabsContent>

            <TabsContent value='frontend' className='grow'>
                <BlockEditorPreviewFrontend blocks={blocks} />
            </TabsContent>
        </Tabs>
    );
}