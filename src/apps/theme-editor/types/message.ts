export type MessageType = 'message' | 'response' | 'reasoning' | 'tool_call' | 'error';

export interface Message {
    id: string;
    createdAt: string;
    type: MessageType;
    content: any;
}

export interface TextMessage extends Message {
    type: 'message' | 'response';
    content: {
        text: string;
    };
}

export interface ReasoningMessage extends Message {
    type: 'reasoning';
    content: {
        chunk: string;
    };
}

export interface ToolCallMessage extends Message {
    type: 'tool_call';
    content: {
        name: string;
        arguments: Record<string, unknown>;
        status: 'pending' | 'success' | 'error';
        error?: string;
        result?: unknown;
    };
}
