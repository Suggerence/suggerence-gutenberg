import { useBlockPlanningStartedHandler } from '@/shared/block-generation/handlers/blockPlanningStarted';
import { useBlockPlanningStepHandler } from '@/shared/block-generation/handlers/blockPlanningStep';
import { useBuildBlockHandler } from '@/shared/block-generation/handlers/buildBlock';
import { useCodeStreamHandler } from '@/shared/block-generation/handlers/codeStream';
import { useCodeUpdateSuccessHandler } from '@/shared/block-generation/handlers/codeUpdateSuccess';
import { useLoadBlockHandler } from '@/shared/block-generation/handlers/loadBlock';
import { useReadFileHandler } from '@/shared/block-generation/handlers/readFile';
import { useReadProjectStructureHandler } from '@/shared/block-generation/handlers/readProjectStructure';
import { useReasoningHandler } from '@/shared/block-generation/handlers/reasoning';
import { useReasoningEndedHandler } from '@/shared/block-generation/handlers/reasoningEnded';
import { useReplaceInFileHandler } from '@/shared/block-generation/handlers/replaceInFile';
import { useReplaceInFileEndedHandler } from '@/shared/block-generation/handlers/replaceInFileEnded';
import { useReplaceInFileStartedHandler } from '@/shared/block-generation/handlers/replaceInFileStarted';
import { useResponseHandler } from '@/shared/block-generation/handlers/response';
import { useShadcnGetItemExamplesFromRegistriesHandler } from '@/shared/block-generation/handlers/shadcnGetItemExamplesFromRegistries';
import { useShadcnGetProjectRegistriesHandler } from '@/shared/block-generation/handlers/shadcnGetProjectRegistries';
import { useShadcnInstallItemsHandler } from '@/shared/block-generation/handlers/shadcnInstallItems';
import { useShadcnListItemsInRegistriesHandler } from '@/shared/block-generation/handlers/shadcnListItemsInRegistries';
import { useShadcnSearchItemsInRegistriesHandler } from '@/shared/block-generation/handlers/shadcnSearchItemsInRegistries';
import { useShadcnViewItemsInRegistriesHandler } from '@/shared/block-generation/handlers/shadcnViewItemsInRegistries';
import { useTodoUpdatedHandler } from '@/shared/block-generation/handlers/todoUpdated';
import { useWriteFileHandler } from '@/shared/block-generation/handlers/writeFile';
import { useWriteFileEndedHandler } from '@/shared/block-generation/handlers/writeFileEnded';
import { useWriteFileStartedHandler } from '@/shared/block-generation/handlers/writeFileStarted';
import { useFinishHandler } from '@/shared/block-generation/handlers/finish';

export const useWebsocketHandlers = () =>
{
    const handleBlockPlanningStarted = useBlockPlanningStartedHandler();
    const handleBlockPlanningStep = useBlockPlanningStepHandler();
    const handleBuildBlock = useBuildBlockHandler();
    const handleCodeStream = useCodeStreamHandler();
    const handleCodeUpdateSuccess = useCodeUpdateSuccessHandler();
    const handleLoadBlock = useLoadBlockHandler();
    const handleReadFile = useReadFileHandler();
    const handleReadProjectStructure = useReadProjectStructureHandler();
    const handleReasoning = useReasoningHandler();
    const handleReasoningEnded = useReasoningEndedHandler();
    const handleReplaceInFile = useReplaceInFileHandler();
    const handleReplaceInFileEnded = useReplaceInFileEndedHandler();
    const handleReplaceInFileStarted = useReplaceInFileStartedHandler();
    const handleResponse = useResponseHandler();
    const handleShadcnGetItemExamplesFromRegistries = useShadcnGetItemExamplesFromRegistriesHandler();
    const handleShadcnGetProjectRegistries = useShadcnGetProjectRegistriesHandler();
    const handleShadcnInstallItems = useShadcnInstallItemsHandler();
    const handleShadcnListItemsInRegistries = useShadcnListItemsInRegistriesHandler();
    const handleShadcnSearchItemsInRegistries = useShadcnSearchItemsInRegistriesHandler();
    const handleShadcnViewItemsInRegistries = useShadcnViewItemsInRegistriesHandler();
    const handleTodoUpdated = useTodoUpdatedHandler();
    const handleWriteFile = useWriteFileHandler();
    const handleWriteFileEnded = useWriteFileEndedHandler();
    const handleWriteFileStarted = useWriteFileStartedHandler();
    const handleFinish = useFinishHandler();

    return {
        handleBlockPlanningStarted,
        handleBlockPlanningStep,
        handleBuildBlock,
        handleCodeStream,
        handleCodeUpdateSuccess,
        handleLoadBlock,
        handleReadFile,
        handleReadProjectStructure,
        handleReasoning,
        handleReasoningEnded,
        handleReplaceInFile,
        handleReplaceInFileEnded,
        handleReplaceInFileStarted,
        handleResponse,
        handleShadcnGetItemExamplesFromRegistries,
        handleShadcnGetProjectRegistries,
        handleShadcnInstallItems,
        handleShadcnListItemsInRegistries,
        handleShadcnSearchItemsInRegistries,
        handleShadcnViewItemsInRegistries,
        handleTodoUpdated,
        handleWriteFile,
        handleWriteFileEnded,
        handleWriteFileStarted,
        handleFinish
    };
}