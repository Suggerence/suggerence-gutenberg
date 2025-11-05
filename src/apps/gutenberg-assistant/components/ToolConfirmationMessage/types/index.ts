export interface ToolConfirmationMessageProps {
    message: MCPClientMessage;
    onAccept: (toolCallId: string) => Promise<void>;
    onReject: (toolCallId: string) => Promise<void>;
    onAlwaysAllow: (toolCallId: string) => Promise<void>;
}
