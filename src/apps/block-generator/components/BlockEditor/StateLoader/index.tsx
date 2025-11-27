import { __ } from '@wordpress/i18n';
import { useQuery } from '@tanstack/react-query';

import { getBlockQueryOptions } from '@/shared/block-generation/query-options';

import { useBlocksStore } from '@/apps/block-generator/stores/blocks';

import { BlockEditorLoaderFeedbackIcon } from '@/apps/block-generator/components/BlockEditor/Loader/Feedback/Icon';

export const formatFeedback = (status: GeneratedBlockStatus) =>
{
    switch (status) {
        case 'pending':
            return __('Working on %s', 'suggerence-blocks');
        case 'planning':
            return __('Planning %s', 'suggerence-blocks');
        case 'coding':
            return __('Coding %s', 'suggerence-blocks');
        case 'refining':
            return __('Refining %s code', 'suggerence-blocks');
        case 'building':
            return __('Building %s', 'suggerence-blocks');
        case 'completed':
            return __('Completing %s', 'suggerence-blocks');
        case 'failed':
            return __('Failed to generate %s', 'suggerence-blocks');
        default:
            return __('Working on %s', 'suggerence-blocks');
    }
}

export const BlockEditorStateLoader = () =>
{
    const { selectedBlockId } = useBlocksStore();
    const { data: block } = useQuery(getBlockQueryOptions(selectedBlockId ?? ''));

    return (
        <div className="absolute bottom-4 right-4 bg-background border border-border rounded-lg flex flex-col items-center gap-4">
            <div className="pt-4">
                <BlockEditorLoaderFeedbackIcon />
            </div>

            <div className="bg-popover p-4 rounded-b-lg">
                <p className="text-primary! text-lg! m-0!">{__('Working', 'suggerence-blocks')}</p>
                <p className="text-muted-foreground! text-sm! m-0!">{formatFeedback(block?.status ?? 'pending').replace('%s', block?.title ?? __('your block', 'suggerence-blocks'))}</p>
            </div>
        </div>
    );
}