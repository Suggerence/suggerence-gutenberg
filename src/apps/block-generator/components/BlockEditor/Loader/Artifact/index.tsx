import { useRef, useEffect, useState } from '@wordpress/element';
import { __ } from "@wordpress/i18n";
import { useQuery } from "@tanstack/react-query";
import { CircleCheck, ChevronDown } from 'lucide-react';

import { getBlockQueryOptions } from "@/shared/block-generation/query-options";

import { useBlocksStore } from "@/apps/block-generator/stores/blocks";
import { useConversationsStore } from "@/apps/block-generator/stores/conversations";

import { FileIcon, FileName } from "@/apps/block-generator/components/BlockEditor/Code/File";
import { Spinner } from "@/components/ui/spinner";
import { TaskItemFile } from "@/components/ai-elements/task";
import { Artifact, ArtifactHeader, ArtifactTitle, ArtifactDescription, ArtifactContent } from "@/components/ai-elements/artifact";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";

const formatStatus = (status: GeneratedBlockStatus, filename: string) =>
{
    const fileBadge = (
        <TaskItemFile>
            <FileIcon filePath={filename} />
            <FileName filePath={filename} />
        </TaskItemFile>
    );

    switch (status) {
        case 'coding':
            return (
                <div className='flex items-center gap-2'>{__('Coding', 'suggerence-blocks')} {fileBadge}</div>
            );
            
        case 'refining':
            return (
                <div className='flex items-center gap-2'>{__('Refining', 'suggerence-blocks')} {fileBadge}</div>
            );

        case 'building':
            return (
                <>{__('Building block...', 'suggerence-blocks')}</>
            );

        case 'completed':
            return (
                <>{__('Block successfully generated', 'suggerence-blocks')}</>
            );

        default:
            return (
                <>{__('Thinking about the block...', 'suggerence-blocks')}</>
            );
    }
}

export const BlockEditorLoaderArtifact = () =>
{
    const { selectedBlockId } = useBlocksStore();
    const { getConversation } = useConversationsStore();
    const [isOpen, setIsOpen] = useState(true);

    const conversation = getConversation(selectedBlockId ?? '');
    const { data: block } = useQuery(getBlockQueryOptions(selectedBlockId ?? ''));

    const linesWritten = conversation?.totalLinesWritten ?? 0;
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
        }
    }, [conversation?.streamedCode]);

    return (
        <Collapsible open={isOpen} onOpenChange={setIsOpen} className={isOpen ? 'h-full max-h-72' : ''}>
            <Artifact className="border-none rounded-none bg-transparent h-full">
                <ArtifactHeader className='border-none justify-start gap-6'>
                    {block?.status === 'completed' ? <CircleCheck className='size-4 text-block-generation-chart-2' /> : <Spinner className="size-4" />}

                    <div className="flex-1">
                        <ArtifactTitle className='m-0!'>{formatStatus(block?.status ?? 'pending', conversation?.aiEditingFile ?? '')}</ArtifactTitle>
                        <ArtifactDescription className='text-xs m-0!'>{linesWritten || 0} {__('lines written', 'suggerence-blocks')}</ArtifactDescription>
                    </div>

                    <CollapsibleTrigger asChild>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="size-8 p-0 text-block-generation-muted-foreground hover:text-block-generation-foreground group"
                        >
                            <ChevronDown className="size-4 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                            <span className="sr-only">{isOpen ? __('Collapse', 'suggerence-blocks') : __('Expand', 'suggerence-blocks')}</span>
                        </Button>
                    </CollapsibleTrigger>
                </ArtifactHeader>

                <CollapsibleContent className="overflow-hidden bg-block-generation-muted h-full">
                    <ArtifactContent className='p-0! bg-block-generation-muted'>
                        <code ref={scrollContainerRef} className='h-full overflow-hidden bg-block-generation-muted'>
                            {(conversation?.streamedCode ?? '').split('\n').map((line, index) => (
                                <pre key={index} className='text-sm'>{line}</pre>
                            ))}
                        </code>
                    </ArtifactContent>
                </CollapsibleContent>
            </Artifact>
        </Collapsible>
    );
}