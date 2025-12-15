import { IconType } from '@wordpress/components';

declare global
{
    const SuggerenceData: SuggerenceData;

    interface BlockSuggestion {
        title: string;
        description: string;
        icon: IconType;
    };

    type GeneratedFileStatus = 'pending' | 'syncing' | 'building' | 'completed' | 'failed';

    interface GeneratedFile
    {
        status: GeneratedFileStatus;
        content: string;
        path?: string;
        filename: string;
        extension: string;
    }

    type GutenbergAttributeType = 'string' | 'number' | 'boolean' | 'array' | 'object';

    interface GutenbergQueryAttribute
    {
        type: GutenbergAttributeType;
        source?: 'html' | 'attribute' | 'text' | 'query';
        selector?: string;
        attribute?: string;
        description?: string;
    }

    interface GutenbergAttribute extends GutenbergQueryAttribute
    {
        default?: any;
        enum?: any[];
        query?: Record<string, GutenbergQueryAttribute>;
    }
    
    interface GutenbergAttributes
    {
        [attributeName: string]: GutenbergAttribute;
    }

    type GeneratedBlockStatus = 'pending' | 'planning' | 'coding' | 'refining' | 'building' | 'completed' | 'failed';

    interface GeneratedBlock
    {
        id: string;
        slug: string;
        title: string;
        description: string;
        icon: string | IconType;
        attributes: GutenbergAttributes;
        src_files: GeneratedFile[];
        file_tree: FileTreeNode[];
        version: string;
        status: GeneratedBlockStatus;
        parent_id: string | null;
        date: string;
        completed_at?: string;
        isRegistered?: boolean;
        lastBuildTime?: string;
        lastBuildFileSnapshots?: Record<string, string>;
    }

    type TodoTaskStatus = 'pending' | 'completed';

    interface TodoTask
    {
        title: string;
        status: TodoTaskStatus;
        description?: string;
    }

    interface Conversation
    {
        blockId: string;
        aiEditingFile: string | null;
        selectedFilePath: string | null;
        streamedCode: string | null;
        totalLinesWritten: number;
        messages: Message[];
    }

    interface MessageContext
    {
        code?: {
            path: string;
            startLine?: number;
            endLine?: number;
        };
    }

    type MessageType = 'message' | 'block_planning' | 'todo' | 'reasoning' | 'response' | 'tool_call' | 'error' | 'suggestion';

    interface Message
    {
        id: string;
        createdAt: string;
        type: MessageType;
        content: any;
    }

    interface TextMessage extends Message
    {
        type: 'message' | 'response';
        content: {
            text: string;
            context?: MessageContext;
        };
    }

    interface PlanningMessage extends Message
    {
        type: 'block_planning';
        content: {
            title?: string;
            icon?: string;
            block_reasoning?: string;
            attributes?: GutenbergAttributes;
        };
    }

    interface TodoMessage extends Message
    {
        type: 'todo';
        content: {
            tasks: TodoTask[];
        };
    }

    interface ReasoningMessage extends Message
    {
        type: 'reasoning';
        content: {
            text: string;
            streaming: boolean;
        };
    }

    interface ErrorMessage extends Message
    {
        type: 'error';
        content: {
            text: string;
        };
    }

    interface SuggestionMessage extends Message
    {
        type: 'suggestion';
        content: {
            description: string;
            type: 'error';
            data: any;
        };
    }

    type ToolName = 'read_project_structure' | 'read_file' | 'write_file' | 'replace_in_file' | 'build_block' | 'load_block' | 'shadcn/get_project_registries' | 'shadcn/list_items_in_registries' | 'shadcn/search_items_in_registries' | 'shadcn/view_items_in_registries' | 'shadcn/get_item_examples_from_registries' | 'shadcn/install_items';

    type ToolCallStatus = 'pending' | 'success' | 'error';

    interface ToolCallMessage extends Message
    {
        type: 'tool_call';
        content: {
            name: ToolName;
            arguments?: any;
            result?: any;
            status: ToolCallStatus;
        };
    }

    type FileTreeNodeType = 'file' | 'folder';

    interface FileTreeNode
    {
        type: FileTreeNodeType;
        name: string;
        path: string;
    }

    interface FileNode extends FileTreeNode
    {
        type: 'file';
        file: GeneratedFile;
    }

    interface FolderNode extends FileTreeNode
    {
        type: 'folder';
        children: FileTreeNode[];
    }

    type WebsocketMessageType = 'block_planning_started' | 'block_planning_step'| 'todo_updated'| 'reasoning'| 'reasoning_ended'| 'response'| 'read_project_structure'| 'read_file'| 'write_file_started'| 'write_file'| 'write_file_ended'| 'replace_in_file_started'| 'replace_in_file'| 'replace_in_file_ended'| 'build_block'| 'load_block'| 'shadcn_get_project_registries'| 'shadcn_list_items_in_registries'| 'shadcn_search_items_in_registries'| 'shadcn_view_items_in_registries'| 'shadcn_get_item_examples_from_registries'| 'shadcn_install_items'| 'code_update_success'| 'code_stream'| 'finish'| 'error';
};

export {};