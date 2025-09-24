import { BlockToolbarIntegration } from '@/apps/gutenberg-toolbar/components/BlockToolbarIntegration';
import { CommandBox } from '@/apps/gutenberg-toolbar/components/CommandBox';

export const GutenbergToolbar = () => {
    return (
        <>
            <BlockToolbarIntegration />
            <CommandBox />
        </>
    );
};