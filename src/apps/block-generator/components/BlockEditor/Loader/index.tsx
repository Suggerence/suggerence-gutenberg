import { BlockEditorLoaderArtifact } from '@/apps/block-generator/components/BlockEditor/Loader/Artifact';
import { BlockEditorLoaderFeedback } from '@/apps/block-generator/components/BlockEditor/Loader/Feedback';

export const BlockEditorLoader = () =>
{
    return (
        <div className="size-full flex flex-col">
            <div className="grow flex flex-col items-center justify-center">
                <BlockEditorLoaderFeedback />
            </div>

            <BlockEditorLoaderArtifact />
        </div>
    );
}