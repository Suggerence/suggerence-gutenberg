interface SuggerenceMCPServerArgs {
    id?: number;
    name: string;
    title: string;
    description: string;
    is_active: boolean;
    // protocol_version: string;
    // capabilities: string;
    // endpoint_url: string;
}

interface SuggerenceMCPServer {
    id: number;
    name: string;
    title: string;
    description: string;
    protocol_version: string;
    capabilities: string;
    endpoint_url: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    type?: 'server' | 'frontend';
}

type SuggerenceMCPServerReturn = {
    message?: string;
    server: SuggerenceMCPServer
}

interface SuggerenceMCPServerConnection extends SuggerenceMCPServer {
    connected: boolean;
    client: any;
}

interface SuggerenceMCPResponseTool {
    name: string;
    description: string;
    inputSchema?: Record<string, any>;
    outputSchema?: Record<string, any>;
    metadata?: Record<string, any>;
    annotations?: Record<string, any>;
    dangerous?: boolean; // Flag to mark tools that require user confirmation
}

interface MCPClientSession {
    id: string;
    name: string;
    messages: MCPClientMessage[];
}

type MCPClientMessageRole = 'user' | 'assistant' | 'tool' | 'tool_confirmation' | 'reasoning';

interface ReasoningTask {
    id: string;
    description: string;
    status: 'pending' | 'in_progress' | 'completed' | 'failed';
    order: number;
}

interface ReasoningContent {
    analysis?: string; // Understanding of the user's request
    plan?: ReasoningTask[]; // List of tasks to accomplish
    // reflection?: string; // Thoughts after tool execution
}

interface MCPClientMessage {
    role: MCPClientMessageRole;
    content: string;
    date: string;
    loading?: boolean;

    aiModel?: string;

    // Tool call fields (for display and tracking)
    toolCallId?: string;
    toolName?: string;
    toolArgs?: Record<string, any>;
    toolResult?: any;

    // Reasoning fields (for 'reasoning' role messages)
    reasoning?: ReasoningContent;
}

interface MCPClientAIResponse {
    type: 'text' | 'tool' | 'reasoning';

    content?: string;

    toolName?: string;
    toolArgs?: Record<string, any>;

    // Reasoning response
    reasoning?: ReasoningContent;
}

type ToolConfirmationAction = 'accept' | 'reject' | 'message';

interface PendingToolCall {
    toolCallId: string;
    toolName: string;
    toolArgs: Record<string, any>;
    timestamp: string;
}