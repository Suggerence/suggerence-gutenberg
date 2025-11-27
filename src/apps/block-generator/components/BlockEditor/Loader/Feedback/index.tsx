import { __ } from '@wordpress/i18n';
import { useQuery } from '@tanstack/react-query';

import { getBlockQueryOptions } from '@/shared/block-generation/query-options';

import { useBlocksStore } from '@/apps/block-generator/stores/blocks';

import { BlockEditorLoaderFeedbackIcon } from '@/apps/block-generator/components/BlockEditor/Loader/Feedback/Icon';

const feedbackVariants: Record<GeneratedBlockStatus | 'default', string[]> = {
    pending: [
        __('Brewing some code magic ☕', 'suggerence-blocks'),
        __('Warming up the engines 🚀', 'suggerence-blocks'),
        __('Preparing the block-making machine 🎰', 'suggerence-blocks'),
    ],
    planning: [
        __('Drawing the blueprint 🗺️', 'suggerence-blocks'),
        __('Plotting the perfect block strategy 🧠', 'suggerence-blocks'),
        __('Crafting the master plan 📋', 'suggerence-blocks'),
    ],
    coding: [
        __('Writing lines of pure genius 💻', 'suggerence-blocks'),
        __('Typing at the speed of light ⚡', 'suggerence-blocks'),
        __('Coding like there\'s no tomorrow 🎯', 'suggerence-blocks'),
    ],
    refining: [
        __('Polishing every pixel ✨', 'suggerence-blocks'),
        __('Making it shine brighter than a diamond 💎', 'suggerence-blocks'),
        __('Fine-tuning the masterpiece 🎨', 'suggerence-blocks'),
    ],
    building: [
        __('Assembling the block pieces 🧩', 'suggerence-blocks'),
        __('Putting it all together 🔨', 'suggerence-blocks'),
        __('Building something amazing 🏗️', 'suggerence-blocks'),
    ],
    completed: [
        __('Adding the final sparkles ✨', 'suggerence-blocks'),
        __('Almost there! Just one more touch 🎭', 'suggerence-blocks'),
        __('Putting the cherry on top 🍒', 'suggerence-blocks'),
    ],
    failed: [
        __('Oops! Something went sideways 😅', 'suggerence-blocks'),
        __('Hit a bump in the road 🛣️', 'suggerence-blocks'),
        __('The block had other plans 🤷', 'suggerence-blocks'),
    ],
    default: [
        __('Contemplating the block universe 🌌', 'suggerence-blocks'),
        __('Channeling creative energy 🎭', 'suggerence-blocks'),
        __('Thinking outside the block 📦', 'suggerence-blocks'),
    ],
};

const formatFeedback = (status: GeneratedBlockStatus) =>
{
    const variants = feedbackVariants[status] ?? feedbackVariants.default;
    const randomIndex = Math.floor(Math.random() * variants.length);

    // Disable random for now
    return variants[0];
}

export const BlockEditorLoaderFeedback = () =>
{
    const { selectedBlockId } = useBlocksStore();

    const { data: block } = useQuery(getBlockQueryOptions(selectedBlockId ?? ''));

    return (
        <div className='text-primary flex flex-col items-center gap-10'>
            <h2 className='text-6xl! text-primary! font-normal! text-center! max-w-xl m-0!'>
                {__('Hold on, your block is being generated', 'suggerence-blocks')}
            </h2>

            <BlockEditorLoaderFeedbackIcon />

            <p className='text-primary! text-lg! text-center! max-w-xl m-0! mt-10! animate-pulse'>
                {formatFeedback(block?.status ?? 'pending')}
            </p>
        </div>
    );
}