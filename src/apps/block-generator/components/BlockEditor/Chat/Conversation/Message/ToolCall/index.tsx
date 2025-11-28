import { __ } from '@wordpress/i18n';
import { ListTree, Hammer, ChevronDown, ToyBrick, Folders, List, Search, Eye, BookOpen, DownloadIcon } from 'lucide-react';

import { TaskItem, TaskItemFile, Task, TaskTrigger, TaskContent } from '@/components/ai-elements/task'
import { Shimmer } from '@/components/ai-elements/shimmer';

import { FileIcon, FileName } from '@/apps/block-generator/components/BlockEditor/Code/File';

import { cn } from '@/lib/utils';

export const ReadProjectStructureToolCall = () =>
{
    return (
        <TaskItem className='flex items-center gap-2'>
            <ListTree className='size-4' />
            {__('Read project structure', 'suggerence-blocks')}
        </TaskItem>
    );
}

export const ReadFileToolCall = ({ toolCall }: { toolCall: ToolCallMessage }) =>
{
    const error = toolCall.content.result?.error;
    const fileNotExists = toolCall.content.result?.exists === false;

    return (
        <TaskItem className='flex items-center gap-2'>
            {
                error && fileNotExists ? (
                    <div className='flex items-center gap-2 text-block-generation-destructive'>
                        {__('File not found', 'suggerence-blocks')}
                        <TaskItemFile>
                            <FileIcon filePath={toolCall.content.arguments.path} />
                            <FileName filePath={toolCall.content.arguments.path} />
                        </TaskItemFile>
                    </div>
                ) : (
                    <>
                        {__('Read file', 'suggerence-blocks')}
                        <TaskItemFile>
                            <FileIcon filePath={toolCall.content.arguments.path} />
                            <FileName filePath={toolCall.content.arguments.path} />
                        </TaskItemFile>
                    </>
                )
            }
        </TaskItem>
    );
}

export const WriteFileToolCall = ({ toolCall }: { toolCall: ToolCallMessage }) =>
{
    const pending = toolCall.content.status === 'pending';
    const contentLength = toolCall.content.arguments.content?.length || 0;

    return (
        <TaskItem className='flex items-center gap-2'>
            {
                pending ? (
                    <>
                        <Shimmer className='text-sm'>{__('Writing file', 'suggerence-blocks')}</Shimmer>
                        <TaskItemFile>
                            <FileIcon filePath={toolCall.content.arguments.path} />
                            <FileName filePath={toolCall.content.arguments.path} />
                            {
                                contentLength > 0 && (
                                    <span className='text-block-generation-chart-2 pl-2'>+{contentLength}</span>
                                )
                            }
                        </TaskItemFile>
                    </>
                ) : (
                    <>
                        {__('Wrote file', 'suggerence-blocks')}
                        <TaskItemFile>
                            <FileIcon filePath={toolCall.content.arguments.path} />
                            <FileName filePath={toolCall.content.arguments.path} />
                            <span className='text-block-generation-chart-2 pl-2'>+{contentLength}</span>
                        </TaskItemFile>
                    </>
                )
            }
        </TaskItem>
    );
}

export const ReplaceInFileToolCall = ({ toolCall }: { toolCall: ToolCallMessage }) =>
{
    const pending = toolCall.content.status === 'pending';
    const sizeDiff = toolCall.content.result?.sizeDiff || 0;

    return (
        <TaskItem className='flex items-center gap-2'>
            {
                pending ? (
                    <>
                        <Shimmer>{__('Editing file', 'suggerence-blocks')}</Shimmer>
                        <TaskItemFile>
                            <FileIcon filePath={toolCall.content.arguments.path} />
                            <FileName filePath={toolCall.content.arguments.path} />
                        </TaskItemFile>
                    </>
                ) : (
                    <>
                        {__('Edited file', 'suggerence-blocks')}
                        <TaskItemFile>
                            <FileIcon filePath={toolCall.content.arguments.path} />
                            <FileName filePath={toolCall.content.arguments.path} />
                            <span className={cn('pl-2', sizeDiff > 0 ? 'text-block-generation-chart-2' : sizeDiff < 0 ? 'text-block-generation-destructive' : 'text-block-generation-foreground')}>{sizeDiff > 0 ? '+' : ''}{sizeDiff}</span>
                        </TaskItemFile>
                    </>
                )
            }
        </TaskItem>
    )
}

export const BuildBlockToolCall = ({ toolCall }: { toolCall: ToolCallMessage }) =>
{
    const buildOutput = toolCall.content.result?.build_output;
    const error = toolCall.content.status === 'error' && buildOutput;

    return (
        <TaskItem>
            <div className='flex items-center gap-2'>
                {
                    toolCall.content.status === 'pending' ? (
                        <>
                            <Hammer className='size-4' />
                            <Shimmer>{__('Building block', 'suggerence-blocks')}</Shimmer>
                        </>
                    ) : toolCall.content.status === 'success' ? (
                        <>
                            <Hammer className='size-4' />
                            {__('Built block', 'suggerence-blocks')}
                        </>
                    ) : (
                        <>
                            <Hammer className='size-4 text-block-generation-destructive' />
                            <span className='text-block-generation-destructive'>{__('Failed to build block', 'suggerence-blocks')}</span>
                        </>
                    )
                }
            </div>

            {
                error && (
                    <Task defaultOpen={false} className='mt-2'>
                        <TaskTrigger title={__('View error details', 'suggerence-blocks')}>
                            <div className='flex w-full cursor-pointer items-center gap-2 text-block-generation-muted-foreground text-xs transition-colors hover:text-block-generation-destructive'>
                                <ChevronDown className='size-3 transition-transform group-data-[state=open]:rotate-180' />
                                <span>{__('View error details', 'suggerence-blocks')}</span>
                            </div>
                        </TaskTrigger>
                        <TaskContent>
                            <pre className='text-xs text-block-generation-destructive whitespace-pre-wrap wrap-break-word bg-block-generation-destructive/10 p-2 rounded border border-block-generation-destructive/20 overflow-x-auto'>
                                {buildOutput}
                            </pre>
                        </TaskContent>
                    </Task>
                )
            }
        </TaskItem>
    );
}

export const LoadBlockToolCall = ({ toolCall }: { toolCall: ToolCallMessage }) =>
{
    return (
        <TaskItem className='flex items-center gap-2'>
            {
                toolCall.content.status === 'pending' ? (
                    <>
                        <ToyBrick className='size-4' />
                        <Shimmer>{__('Loading block', 'suggerence-blocks')}</Shimmer>
                    </>
                ) : toolCall.content.status === 'success' ? (
                    <>
                        <ToyBrick className='size-4' />
                        {__('Loaded block', 'suggerence-blocks')}
                    </>
                ) : (
                    <>
                        <ToyBrick className='size-4 text-block-generation-destructive' />
                        <span className='text-block-generation-destructive'>{__('Failed to load block', 'suggerence-blocks')}</span>
                    </>
                )
            }
        </TaskItem>
    );
}

export const GetProjectRegistriesToolCall = () =>
{
    return (
        <TaskItem className='flex items-center gap-2'>
            <Folders className='size-4' />
            {__('Obtained Shadcn registries', 'suggerence-blocks')}
        </TaskItem>
    )
}

export const ListItemsInRegistriesToolCall = ({ toolCall }: { toolCall: ToolCallMessage }) =>
{
    return (
        <TaskItem className='flex items-center gap-2'>
            <List className='size-4' />
            {__('Listed items in registries', 'suggerence-blocks')}
            {
                toolCall.content.arguments?.registries.map((registry: string) => (
                    <TaskItemFile key={registry}>{registry}</TaskItemFile>
                ))
            }
        </TaskItem>
    );
}

export const SearchItemsInRegistriesToolCall = ({ toolCall }: { toolCall: ToolCallMessage }) =>
{
    return (
        <TaskItem className='flex items-center gap-2'>
            <Search className='size-4' />
            {__('Searched items in registries', 'suggerence-blocks')}
            <TaskItemFile>{toolCall.content.arguments.query}</TaskItemFile>
        </TaskItem>
    );
}

export const ViewItemInRegistriesToolCall = ({ toolCall }: { toolCall: ToolCallMessage }) =>
{
    return (
        <>
            <TaskItem className='flex items-center gap-2'>
                <Eye className='size-4' />
                {__('Viewed items in registries', 'suggerence-blocks')}
            </TaskItem>

            <div className='flex gap-2 flex-wrap'>
                {toolCall.content.arguments?.items.map((item: string) => (
                    <TaskItemFile key={item}>{item}</TaskItemFile>
                ))}
            </div>
        </>
    );
}

export const GetItemExamplesFromRegistriesToolCall = ({ toolCall }: { toolCall: ToolCallMessage }) =>
{
    return (
        <TaskItem className='flex items-center gap-2'>
            <BookOpen className='size-4' />
            {__('Got item examples from query', 'suggerence-blocks')}
            <TaskItemFile>{toolCall.content.arguments.query}</TaskItemFile>
        </TaskItem>
    );
}

export const InstallItemsToolCall = ({ toolCall }: { toolCall: ToolCallMessage }) =>
{
    return (
        <TaskItem className='flex items-center gap-2'>
            {
                toolCall.content.status === 'pending' ? (
                    <>
                        <DownloadIcon className='size-4' />
                        <Shimmer>{__('Installing items', 'suggerence-blocks')}</Shimmer>
                    </>
                ) : toolCall.content.status === 'success' ? (
                    <>
                        <DownloadIcon className='size-4' />
                        {__('Installed items', 'suggerence-blocks')}
                    </>
                ) : (
                    <>
                        <DownloadIcon className='size-4 text-block-generation-destructive' />
                        <span className='text-block-generation-destructive'>{__('Failed to install items', 'suggerence-blocks')}</span>
                    </>
                )
            }
        </TaskItem>
    )
}

export const ToolCallMessage = ({ message }: { message: ToolCallMessage }) =>
{
    switch (message.content.name) {
        case 'read_project_structure':
            return <ReadProjectStructureToolCall />;

        case 'read_file':
            return <ReadFileToolCall toolCall={message} />;

        case 'write_file':
            return <WriteFileToolCall toolCall={message} />;

        case 'replace_in_file':
            return <ReplaceInFileToolCall toolCall={message} />;

        case 'build_block':
            return <BuildBlockToolCall toolCall={message} />;

        case 'load_block':
            return <LoadBlockToolCall toolCall={message} />;

        case 'shadcn/get_project_registries':
            return <GetProjectRegistriesToolCall />;

        case 'shadcn/list_items_in_registries':
            return <ListItemsInRegistriesToolCall toolCall={message} />;

        case 'shadcn/search_items_in_registries':
            return <SearchItemsInRegistriesToolCall toolCall={message} />;

        case 'shadcn/view_items_in_registries':
            return <ViewItemInRegistriesToolCall toolCall={message} />;

        case 'shadcn/get_item_examples_from_registries':
            return <GetItemExamplesFromRegistriesToolCall toolCall={message} />;

        case 'shadcn/install_items':
            return <InstallItemsToolCall toolCall={message} />;
    }
}