import { useState, useRef, useEffect } from '@wordpress/element';
import { useQueryClient, useMutation, useQuery } from "@tanstack/react-query";

import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { json } from '@codemirror/lang-json';
import { php } from '@codemirror/lang-php';
import { sass } from '@codemirror/lang-sass';
import { atomone } from '@uiw/codemirror-theme-atomone';
import { vscodeLight } from '@uiw/codemirror-theme-vscode';

import { updateBlockMutationOptions } from "@/shared/block-generation/mutation-options";
import { getBlockQueryOptions } from '@/shared/block-generation/query-options';

import { useBlocksStore } from "@/apps/block-generator/stores/blocks";
import { useConversationsStore } from "@/apps/block-generator/stores/conversations";
import { useWebsocketStore } from "@/apps/block-generator/stores/websocket";
import { useConfigurationStore } from '@/apps/block-generator/stores/configuration';

// Helper function to find a file in file_tree recursively
const findFileInTree = (nodes: FileTreeNode[], path: string): FileNode | null => {
    for (const node of nodes) {
        if (node.type === 'file' && node.path === path) {
            return node as FileNode;
        }
        if (node.type === 'folder') {
            const folderNode = node as FolderNode;
            const found = findFileInTree(folderNode.children, path);
            if (found) return found;
        }
    }
    return null;
};

export const BlockEditorCodeEditor = () =>
{
    const { selectedBlockId } = useBlocksStore();
    const { getConversation } = useConversationsStore();
    const { send: sendWebsocketMessage } = useWebsocketStore();
    const { theme } = useConfigurationStore();
    const queryClient = useQueryClient();
    const { mutate: updateBlock } = useMutation(updateBlockMutationOptions());
    const { data: block } = useQuery(getBlockQueryOptions(selectedBlockId ?? ''));

    const conversation = getConversation(selectedBlockId ?? '');

    const [editorValue, setEditorValue] = useState('');
    const debounceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const lastFilePathRef = useRef<string | null>(null);

    // Find the current file from either src_files or file_tree
    const getCurrentFile = (): GeneratedFile | null => {
        if (!block || !conversation?.selectedFilePath) return null;

        // First try to find in src_files
        const normalizedPath = conversation.selectedFilePath.replace(/^\.\//, '');
        const fileInSrcFiles = block.src_files?.find(file => {
            const filePath = file.path ?? file.filename;
            const cleanFilePath = filePath.replace(/^\.\//, '');
            return cleanFilePath === normalizedPath || file.path === conversation.selectedFilePath;
        });

        if (fileInSrcFiles) return fileInSrcFiles;

        // If not found, try to find in file_tree
        if (block.file_tree) {
            const fileNode = findFileInTree(block.file_tree, conversation.selectedFilePath);
            if (fileNode) return fileNode.file;
        }

        return null;
    };

    // Update editor value when file changes or content is updated from WebSocket
    useEffect(() => {
        const currentFile = getCurrentFile();
        
        if (!currentFile || !conversation?.selectedFilePath) {
            setEditorValue('');
            lastFilePathRef.current = null;
            return;
        }

        if (conversation.selectedFilePath !== lastFilePathRef.current) {
            // Different file selected, update the value
            setEditorValue(currentFile.content);
            lastFilePathRef.current = conversation.selectedFilePath;
        } else {
            // Same file, but content might have been updated from WebSocket
            setEditorValue(currentFile.content);
        }
    }, [block, conversation?.selectedFilePath]);

    // Cleanup timeout on unmount
    useEffect(() =>
    {
        return () => {
            if (debounceTimeoutRef.current) {
                clearTimeout(debounceTimeoutRef.current);
            }
        }
    }, []);

    const handleChange = (value: string) =>
    {
        setEditorValue(value);

        if (!selectedBlockId || !block || !conversation?.selectedFilePath) return;

        // Update the file content in the block's src_files
        const normalizedPath = conversation.selectedFilePath.replace(/^\.\//, '');
        const updatedFiles = (block.src_files ?? []).map(file => {
            const filePath = file.path ?? file.filename;
            const cleanFilePath = filePath.replace(/^\.\//, '');
            
            if (cleanFilePath === normalizedPath || file.path === conversation.selectedFilePath) {
                return { ...file, content: value };
            }
            return file;
        });

        // Optimistically update the cache immediately (no flickering)
        const updatedBlock: Partial<GeneratedBlock> = {
            ...block,
            src_files: updatedFiles
        };

        queryClient.setQueryData(['block', selectedBlockId], updatedBlock);
        
        // Clear any existing timeout
        if (debounceTimeoutRef.current) {
            clearTimeout(debounceTimeoutRef.current);
        }

        // Set a new timeout to send the code update and persist mutation after 500ms of inactivity
        debounceTimeoutRef.current = setTimeout(() => {
            // Persist the update to the API (debounced)
            updateBlock({
                blockId: selectedBlockId,
                block: {
                    src_files: updatedFiles
                },
            });
            
            // Send the code update via WebSocket (debounced)
            // Find the file node to construct the message
            const currentFile = getCurrentFile();
            if (currentFile) {
                const fileNode = findFileInTree(block.file_tree ?? [], conversation.selectedFilePath ?? '');
                
                sendWebsocketMessage('code_update', {
                    blockId: selectedBlockId,
                    file: fileNode ? {
                        type: 'file',
                        name: fileNode.name,
                        path: fileNode.path,
                        file: {
                            path: currentFile.path ?? fileNode.path,
                            filename: currentFile.filename,
                            extension: currentFile.extension,
                            content: value
                        }
                    } : {
                        type: 'file',
                        name: currentFile.filename,
                        path: conversation.selectedFilePath,
                        file: {
                            path: currentFile.path ?? conversation.selectedFilePath,
                            filename: currentFile.filename,
                            extension: currentFile.extension,
                            content: value
                        }
                    },
                    content: value
                });
            }
        }, 500);
    };

    const canEdit = () => {
        if (!block) return false;
        return block.status === 'completed' || block.status === 'failed';
    };

    return (
        <CodeMirror
            value={editorValue}
            theme={theme === 'dark' ? atomone : vscodeLight}
            onChange={handleChange}
            className="grow overflow-auto min-h-0 [&>div]:h-full"
            editable={canEdit()}
            extensions={[
                javascript({ jsx: true }),
                json(),
                php(),
                sass()
            ]}
        />
    );
}