import { useState } from '@wordpress/element';
import { useQuery } from '@tanstack/react-query';
import { Loader, ChevronDown, ChevronRight, Folder, FolderOpen } from 'lucide-react';

import { getBlockQueryOptions } from '@/shared/block-generation/query-options';

import { useBlocksStore } from '@/apps/block-generator/stores/blocks';
import { useConversationsStore } from '@/apps/block-generator/stores/conversations';

import { FileIcon } from '@/apps/block-generator/components/BlockEditor/Code/File';

import { cn } from '@/lib/utils';

const FileTreeNodeFolder = ({ node }: { node: FolderNode }) =>
{
    const [isOpen, setIsOpen] = useState(true);

    return (
        <div className='w-full'>
            <div className='flex items-center gap-2 px-1 py-0.5 cursor-pointer hover:bg-muted-foreground/10 rounded select-none text-sm' onClick={() => setIsOpen(!isOpen)}>
                {isOpen ? <ChevronDown className='size-4' /> : <ChevronRight className='size-4' />}
                {isOpen ? <FolderOpen className='size-4' /> : <Folder className='size-4' />}
                <span className='text-sm font-medium'>{node.name}</span>
            </div>

            {
                isOpen && (
                    <div className='pl-4 border-l border-border ml-3'>
                        {node.children.map(child => <FileTreeNode key={child.path} node={child} />)}
                    </div>
                )
            }
        </div>
    );
}

const FileTreeNodeFile = ({ node }: { node: FileNode }) =>
{
    const { selectedBlockId } = useBlocksStore();
    const { getConversation, setSelectedFilePath } = useConversationsStore();

    const conversation = getConversation(selectedBlockId ?? '');

    const isSelected = conversation?.selectedFilePath === node.path;
    const beingEdited = conversation?.aiEditingFile === node.path;

    return (
        <div className={cn('flex items-center gap-2 px-1 py-0.5 cursor-pointer hover:bg-muted-foreground/10 rounded', isSelected || beingEdited ? 'bg-muted-foreground' : '', beingEdited ? 'animate-pulse' : '')} onClick={() => setSelectedFilePath(blockId ?? '', node.path)}>
            {beingEdited ? <Loader className='size-4 animate-spin' /> : <FileIcon filePath={node.path} />}
            <span className='text-sm flex-1'>{node.name}</span>
        </div>
    )
}

const FileTreeNode = ({ node }: { node: FileTreeNode }) =>
{
    return node.type === 'file' ? <FileTreeNodeFile node={node as FileNode} /> : <FileTreeNodeFolder node={node as FolderNode} />;
}

export const BlockEditorCodeFileTree = () =>
{
    const { blockId } = useBlocksStore();
    const { data: block } = useQuery(getBlockQueryOptions(blockId ?? ''));

    return (
        <div className="min-w-fit border-r border-border flex flex-col p-3 overflow-auto min-h-0">
            <div className="flex flex-col gap-1">
                {block?.file_tree?.map(node => <FileTreeNode key={node.path} node={node} />)}
            </div>
        </div>
    );
}