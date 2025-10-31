interface ToolConfirmationMessageProps {
    message: MCPClientMessage;
    onAccept: () => void;
    onReject: () => void;
}