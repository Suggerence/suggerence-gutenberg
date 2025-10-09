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

type MCPClientMessageRole = 'user' | 'assistant' | 'tool' | 'tool_confirmation';

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
}

interface MCPClientAIResponse {
    type: 'text' | 'tool';

    content?: string;

    toolName?: string;
    toolArgs?: Record<string, any>;
}

type ToolConfirmationAction = 'accept' | 'reject' | 'message';

interface PendingToolCall {
    toolCallId: string;
    toolName: string;
    toolArgs: Record<string, any>;
    timestamp: string;
}