import { useEffect } from '@wordpress/element';
import { useDispatch } from '@wordpress/data';

import { BlockEditorKeyboardShortcuts, WritingFlow, ObserveTyping, BlockList } from '@wordpress/block-editor';

interface BlockEditorPreviewEditorWindowProps
{
    blockClientId: string;
}

export const BlockEditorPreviewEditorWindow = ({ blockClientId }: BlockEditorPreviewEditorWindowProps) =>
{
    const { selectBlock } = useDispatch('core/block-editor');
    
    useEffect(() => {
        selectBlock(blockClientId);
    }, [blockClientId]);

    return (
        <div className='grow bg-white p-10 text-black overflow-auto'>
            <BlockEditorKeyboardShortcuts />
            <WritingFlow>
                <ObserveTyping>
                    <BlockList />
                </ObserveTyping>
            </WritingFlow>
        </div>
    );
}