import { useEffect } from '@wordpress/element';

import { useWebsocketStore } from '@/apps/block-generator/stores/websocket';
import { useWebsocketHandlers } from '@/shared/block-generation/handlers/handler';

export const WebsocketHandler = () =>
{
    const { addMessageHandler } = useWebsocketStore();

    const {
        handleBlockPlanningStarted,
        handleBlockPlanningStep,
        handleBuildBlock,
        // handleCodeStream,
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
        handleFinish,
        handleError
    } = useWebsocketHandlers();
    
    useEffect(() =>
    {
        const handleMessage = (event: MessageEvent) =>
        {
            const parsed = JSON.parse(event.data);
            const message: { type: WebsocketMessageType, data?: unknown, message?: string, code?: string | number } = parsed;

            switch (message.type) {
                case 'block_planning_started':
                    handleBlockPlanningStarted(message.data);
                    break;

                case 'block_planning_step':
                    handleBlockPlanningStep(message.data as { title?: string | undefined; icon?: string | undefined; slug?: string | undefined; attributes?: GutenbergAttributes | undefined; });
                    break;

                case 'build_block':
                    handleBuildBlock(message.data as { status: 'building' | 'built', success: boolean, build_output?: string | undefined; error?: string | undefined; files?: Record<string, string> | undefined; });
                    break;

                // case 'code_stream':
                //     handleCodeStream(message.data as { content: string });
                //     break;

                case 'code_update_success':
                    handleCodeUpdateSuccess(message.data as { blockId: string, path: string });
                    break;

                case 'load_block':
                    handleLoadBlock(message.data as { blockId: string, requestId: string });
                    break;

                case 'read_file':
                    handleReadFile(message.data as { blockId: string, path: string });
                    break;

                case 'read_project_structure':
                    handleReadProjectStructure(message.data);
                    break;

                case 'reasoning':
                    handleReasoning(message.data as { chunk: string });
                    break;

                case 'reasoning_ended':
                    handleReasoningEnded(message.data);
                    break;

                case 'replace_in_file':
                    handleReplaceInFile(message.data as { blockId: string, path: string, content: string });
                    break;

                case 'replace_in_file_ended':
                    handleReplaceInFileEnded(message.data as { path: string, result?: { sizeDiff: number, oldLength: number, newLength: number } });
                    break;

                case 'replace_in_file_started':
                    handleReplaceInFileStarted(message.data as { path: string });
                    break;

                case 'response':
                    handleResponse(message.data as { chunk: string });
                    break;

                case 'shadcn_get_item_examples_from_registries':
                    handleShadcnGetItemExamplesFromRegistries(message.data as { query: string });
                    break;

                case 'shadcn_get_project_registries':
                    handleShadcnGetProjectRegistries(message.data as { success: boolean, registries: string[] });
                    break;

                case 'shadcn_install_items':
                    handleShadcnInstallItems(message.data as { items: string[], command: string, status: 'pending' | 'success' | 'error' });
                    break;

                case 'shadcn_list_items_in_registries':
                    handleShadcnListItemsInRegistries(message.data as { registries: string[] });
                    break;

                case 'shadcn_search_items_in_registries':
                    handleShadcnSearchItemsInRegistries(message.data as { query: string });
                    break;

                case 'shadcn_view_items_in_registries':
                    handleShadcnViewItemsInRegistries(message.data as { items: string[] });
                    break;

                case 'todo_updated':
                    handleTodoUpdated(message.data as { tasks: TodoTask[] });
                    break;

                case 'write_file':
                    handleWriteFile(message.data as { path: string, content: string });
                    break;

                case 'write_file_ended':
                    handleWriteFileEnded(message.data as { path: string, appendLines?: boolean });
                    break;

                case 'write_file_started':
                    handleWriteFileStarted(message.data as { path: string });
                    break;

                case 'finish':
                    handleFinish();
                    break;

                case 'error':
                    handleError({ type: 'error', message: message.message || 'Unknown error', code: String(message.code || ''), data: message.data });
                    break;

                default:
                    console.log(`Received event: ${message.type}`);
                    break;
            }
        };

        return addMessageHandler(handleMessage);
    }, [addMessageHandler, handleBlockPlanningStarted, handleBlockPlanningStep, handleBuildBlock, handleCodeUpdateSuccess, handleLoadBlock, handleReadFile, handleReadProjectStructure, handleReasoning, handleReasoningEnded, handleReplaceInFile, handleReplaceInFileEnded, handleReplaceInFileStarted, handleResponse, handleShadcnGetItemExamplesFromRegistries, handleShadcnGetProjectRegistries, handleShadcnInstallItems, handleShadcnListItemsInRegistries, handleShadcnSearchItemsInRegistries, handleShadcnViewItemsInRegistries, handleTodoUpdated, handleWriteFile, handleWriteFileEnded, handleWriteFileStarted, handleFinish, handleError]);
    
    return null;
}