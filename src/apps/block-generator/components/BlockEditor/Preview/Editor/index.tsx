import { __ } from '@wordpress/i18n';
import { Popover, SlotFillProvider } from '@wordpress/components';
import { BlockEditorProvider, BlockInspector } from '@wordpress/block-editor';

import { Spinner } from '@/components/ui/spinner';

import { BlockEditorPreviewEditorWindow } from '@/apps/block-generator/components/BlockEditor/Preview/Editor/Window';

import '@/apps/block-generator/components/BlockEditor/Preview/Editor/style.scss';

interface BlockEditorPreviewEditorProps {
    blocks: any[];
    isReady: boolean;
    onInput: (blocks: any[]) => void;
    onChange: (blocks: any[]) => void;
}

export const BlockEditorPreviewEditor = ({ blocks, isReady, onInput, onChange }: BlockEditorPreviewEditorProps) =>
{
    return (
        <SlotFillProvider>
            <BlockEditorProvider value={blocks} onInput={onInput} onChange={onChange} settings={{ hasFixedToolbar: false }}>
                {
                    isReady && blocks.length > 0 ? (
                        <div className='size-full flex'>
                            <BlockEditorPreviewEditorWindow blockClientId={blocks[0].clientId} />

                            <BlockInspector showNoBlockSelectedMessage={true} />
                        </div>
                    ) : (
                        <div className='size-full flex flex-col items-center justify-center'>
                            <div className='flex items-center gap-4'>
                                <Spinner className='size-8' />
                                <span className='text-2xl'>{__('Loading block...', 'suggerence-blocks')}</span>
                            </div>
                        </div>
                    )
                }

                <Popover.Slot />
            </BlockEditorProvider>
        </SlotFillProvider>
    );
}