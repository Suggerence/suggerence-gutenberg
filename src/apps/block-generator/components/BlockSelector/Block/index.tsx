import { Icon } from '@wordpress/components';
import { trash } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';

import { cn } from '@/lib/utils';

import { Spinner } from '@/components/ui/spinner';

interface BlockSelectorBlockProps
{
    title?: string;
    description?: string;
    icon?: any;
    status?: string;
    onClick?: () => void;
    onDelete?: (event: React.MouseEvent) => void;
    className?: string;
    generating: boolean;
}

export const BlockSelectorBlock = ({ title, description, icon, status, onClick, onDelete, className, generating }: BlockSelectorBlockProps) =>
{
    const handleDeleteClick = (event: React.MouseEvent) =>
    {
        event.stopPropagation();
        onDelete?.(event);
    }

    return (
        <div className={cn('group relative rounded-lg p-4 flex flex-col border border-block-generation-border bg-block-generation-muted cursor-pointer transition-all duration-300 ease-out hover:border-block-generation-primary hover:bg-block-generation-muted/50', generating && 'border-block-generation-primary bg-block-generation-muted/50 hover:border-block-generation-primary/50 hover:bg-block-generation-muted/10', className)} onClick={onClick}>
            {/* Glow effect on hover */}
            <div className='absolute inset-0 rounded-lg bg-linear-to-br from-block-generation-primary/10 to-block-generation-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ease-out'></div>
        
            {/* Generating pulse effect */}
            {
                generating && (
                    <>
                        <div className='absolute inset-0 rounded-lg bg-block-generation-muted/75 animate-pulse'></div>
                        <div className='absolute inset-0 rounded-lg border-2 border-block-generation-primary animate-[pulse_2s_ease-in-out_infinite]'></div>
                    </>
                )
            }
            {/* Content */}
            <div className='relative z-10 w-full flex flex-col gap-3'>

                {/* Icon */}
                <div className={cn('flex items-center justify-center w-full h-16 rounded-lg bg-linear-to-br from-block-generation-background to-block-generation-background/75 group-hover:from-block-generation-background/75 group-hover:to-block-generation-background/50 transition-all duration-300 shrink-0', generating && 'from-block-generation-primary/10 to-block-generation-primary/5')}>
                    {
                        generating ? <Spinner className='size-5' /> : <Icon icon={icon} fill='currentColor' className='size-5 group-hover:scale-110 transition-transform duration-300' />
                    }
                </div>

                <div>
                    <div className='flex items-center gap-3 justify-between'>
                        {/* Title */}
                        <h3 className='text-block-generation-primary! font-semibold text-base! m-0! group-hover:text-block-generation-primary/90! transition-colors duration-300! flex-1'>
                            {title || (generating ? __('Generating...', 'suggerence-blocks') : __('Untitled', 'suggerence-blocks'))}
                        </h3>

                        {/* Delete button */}
                        {
                            onDelete && (
                                <button onClick={handleDeleteClick} className='transition-all duration-200 p-1.5 rounded hover:bg-block-generation-primary/20 shrink-0 cursor-pointer' title={__('Delete block', 'suggerence-blocks')}>
                                    <Icon icon={trash} fill='currentColor' className='size-4 hover:scale-110 transition-transform' />
                                </button>
                            )
                        }
                    </div>

                    {/* Description */}
                    <p className='text-block-generation-muted-foreground! text-sm! m-0! leading-relaxed! group-hover:text-block-generation-muted-foreground/70! transition-colors duration-300! line-clamp-2'>
                        {description || (generating ? __('Creating you custom block...', 'suggerence-blocks') : __('No description provided', 'suggerence-blocks'))}
                    </p>
                </div>

                {/* Generating indicator badge */}
                {
                    generating && (
                        <div className='flex items-center gap-2 mt-1'>
                            <div className='size-2 rounded-full bg-block-generation-primary animate-pulse'></div>
                            <span className='text-block-generation-primary text-xs font-medium'>
                                {status && status.charAt(0).toUpperCase() + status.slice(1) || __('Generating...', 'suggerence-blocks')}
                            </span>
                        </div>
                    )
                }
            </div>
        </div>
    );
}