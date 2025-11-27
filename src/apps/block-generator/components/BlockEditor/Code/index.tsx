import { useEffect } from '@wordpress/element';
import { useQuery } from '@tanstack/react-query';

import { getBlockQueryOptions } from '@/shared/block-generation/query-options';

import { useBlocksStore } from '@/apps/block-generator/stores/blocks';
import { useConversationsStore } from '@/apps/block-generator/stores/conversations';

import { BlockEditorCodeFileTree } from '@/apps/block-generator/components/BlockEditor/Code/FileTree';
import { BlockEditorCodeSkeleton } from '@/apps/block-generator/components/BlockEditor/Code/Skeleton';
import { BlockEditorCodeEditor } from '@/apps/block-generator/components/BlockEditor/Code/Editor';

export const BlockEditorCode = () =>
{    
    const { selectedBlockId } = useBlocksStore();
    const { data: block } = useQuery(getBlockQueryOptions(selectedBlockId ?? ''));
    const { getConversation, setSelectedFilePath } = useConversationsStore();

    const conversation = getConversation(selectedBlockId ?? '');

    // TODO: If the user currently is on the AI selected path, and the AI creates a new file, select the new file
    useEffect(() => {
        if (!block) return;

        if (!conversation?.selectedFilePath && block.src_files?.length && block.src_files.length > 0) {
            setSelectedFilePath(selectedBlockId ?? '', block.src_files[0].path ?? '');
        }
    }, [block]);

    return (
        <div className="w-full h-full flex min-h-0 min-w-0">
            {
                block?.src_files && block.src_files.length > 0 && (
                    <BlockEditorCodeFileTree />
                )
            }

            {
                conversation?.selectedFilePath ? (
                    <BlockEditorCodeEditor />
                ) : (
                    <BlockEditorCodeSkeleton />
                )
            }
        </div>
    );
}