import { __ } from "@wordpress/i18n";
import { Trash2 } from "lucide-react";

import { useBlocksStore } from '@/apps/block-generator/stores/blocks';
import { useConversationsStore } from '@/apps/block-generator/stores/conversations';

interface BlockEditorChatHeaderProps
{
    title?: string;
}

export const BlockEditorChatHeader = ({ title }: BlockEditorChatHeaderProps) =>
{
    const { blockId } = useBlocksStore();
    const { clearConversation } = useConversationsStore();

    const handleClearConversation = () =>
    {
        if (!blockId) return;

        clearConversation(blockId);
    }
    
    return (
        <div className="flex items-center justify-between p-2 border-b border-block-generation-border shrink-0">
            <h3 className="text-sm font-medium m-0! text-block-generation-primary! truncate">
                {title ?? __('Chat', 'suggerence-blocks')}
            </h3>

            <button type="button" className="p-1.5 hover:bg-block-generation-muted rounded-md transition-colors cursor-pointer" onClick={handleClearConversation} title={__('Clear conversation', 'suggerence-blocks')}>
                <Trash2 className="size-4 text-block-generation-primary" />
            </button>
        </div>
    );
}