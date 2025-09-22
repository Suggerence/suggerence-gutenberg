import { BlockToolbarIntegration } from './components/BlockToolbarIntegration';
import { CommandBox } from './components/CommandBox';

export const GutenbergToolbar = () => {
    return (
        <>
            <BlockToolbarIntegration />
            <CommandBox />
        </>
    );
};