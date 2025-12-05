import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
import { UserMessage } from '@/apps/gutenberg-assistant/components/UserMessage';
import { ToolMessage } from '@/apps/gutenberg-assistant/components/ToolMessage';
import { ActionMessage } from '@/apps/gutenberg-assistant/components/ActionMessage';
import { AssistantMessage } from '@/apps/gutenberg-assistant/components/AssistantMessage';
import { ThinkingMessage } from '@/apps/gutenberg-assistant/components/ThinkingMessage';
import { ThinkToolMessage } from '@/apps/gutenberg-assistant/components/ThinkToolMessage';
import { ToolConfirmationMessage } from '@/apps/gutenberg-assistant/components/ToolConfirmationMessage';
import { AssistantMessageGroup } from '@/apps/gutenberg-assistant/components/AssistantMessageGroup';
import { ConfirmationAction } from '@/components/ai-elements/confirmation';
import { useToolConfirmationStore } from '@/apps/gutenberg-assistant/stores/toolConfirmationStore';

interface ConversationProps {
    messages: MCPClientMessage[];
    onAcceptTool: (toolCallId: string) => Promise<void>;
    onRejectTool: (toolCallId: string) => Promise<void>;
    onAcceptAllTools: () => Promise<void>;
    onAlwaysAllowTool: (toolCallId: string) => Promise<void>;
}

// Group consecutive assistant messages together
const groupMessages = (messages: MCPClientMessage[]) => {
    const groups: Array<{ type: 'user' | 'assistant-group', messages: MCPClientMessage[] }> = [];
    let currentGroup: MCPClientMessage[] = [];
    let currentType: 'user' | 'assistant-group' | null = null;

    messages.forEach((message) => {
        const messageType = message.role === 'user' ? 'user' : 'assistant-group';

        if (messageType === currentType) {
            currentGroup.push(message);
        } else {
            if (currentGroup.length > 0) {
                groups.push({ type: currentType!, messages: currentGroup });
            }
            currentGroup = [message];
            currentType = messageType;
        }
    });

    if (currentGroup.length > 0) {
        groups.push({ type: currentType!, messages: currentGroup });
    }

    return groups;
};

export const Conversation = ({ messages, onAcceptTool, onRejectTool, onAcceptAllTools, onAlwaysAllowTool }: ConversationProps) => {
    const [isAllowAllProcessing, setIsAllowAllProcessing] = useState(false);
    const pendingToolCalls = useToolConfirmationStore((state) => state.pendingToolCalls);

    const handleAllowAll = async () => {
        setIsAllowAllProcessing(true);
        try {
            await onAcceptAllTools();
        } finally {
            setIsAllowAllProcessing(false);
        }
    };

    return (
        <div className="space-y-0">
            {groupMessages(messages).map((group, groupIndex) => {
                if (group.type === 'user') {
                    return group.messages.map((message, index) => (
                        <UserMessage
                            key={`${message.role}-${groupIndex}-${index}-${message.date}`}
                            message={message}
                        />
                    ));
                }

                // Assistant group - wrap in AssistantMessageGroup with vertical line
                return (
                    <AssistantMessageGroup key={`assistant-group-${groupIndex}`}>
                        {group.messages.map((message, index) => {
                            if (message.role === 'tool_confirmation') {
                                return (
                                    <ToolConfirmationMessage
                                        key={`${message.role}-${groupIndex}-${index}-${message.date}`}
                                        message={message}
                                        onAccept={onAcceptTool}
                                        onReject={onRejectTool}
                                        onAlwaysAllow={onAlwaysAllowTool}
                                    />
                                );
                            }

                            if (message.role === 'thinking') {
                                return (
                                    <ThinkingMessage
                                        key={`${message.role}-${groupIndex}-${index}-${message.date}`}
                                        message={message}
                                    />
                                );
                            }

                            if (message.role === 'tool') {
                                // Get clean tool name
                                const cleanToolName = message.toolName?.replace(/^[^_]*___/, '') || message.toolName;

                                // Special handling for think tool - show as reasoning component
                                if (cleanToolName === 'think') {
                                    return (
                                        <ThinkToolMessage
                                            key={`${message.role}-${groupIndex}-${index}-${message.date}`}
                                            message={message}
                                        />
                                    );
                                }

                                // Define tools that should be completely hidden from the user
                                const hiddenTools = ['get_block_schema'];

                                // Don't render hidden tools
                                if (cleanToolName && hiddenTools.includes(cleanToolName)) {
                                    return null;
                                }

                                // Define tools that should show as thinking messages
                                const thinkingTools: Record<string, { thinking: string; completed: string }> = {
                                    'get_available_blocks': {
                                        thinking: __('Looking up available blocks...', 'suggerence'),
                                        completed: __('Retrieved available blocks', 'suggerence')
                                    },
                                    'get_document_structure': {
                                        thinking: __('Analyzing document structure...', 'suggerence'),
                                        completed: __('Analyzed document structure', 'suggerence')
                                    }
                                };

                                // Use ActionMessage for certain tools, ToolMessage for others
                                if (cleanToolName != undefined && thinkingTools[cleanToolName]) {
                                    return (
                                        <ActionMessage
                                            key={`${message.role}-${groupIndex}-${index}-${message.date}`}
                                            message={message}
                                            initialText={thinkingTools[cleanToolName].thinking}
                                            completedText={thinkingTools[cleanToolName].completed}
                                        />
                                    );
                                }

                                return (
                                    <ToolMessage
                                        key={`${message.role}-${groupIndex}-${index}-${message.date}`}
                                        message={message}
                                    />
                                );
                            }

                            return (
                                <AssistantMessage
                                    key={`${message.role}-${groupIndex}-${index}-${message.date}`}
                                    message={message}
                                />
                            );
                        })}
                    </AssistantMessageGroup>
                );
            })}
            {pendingToolCalls.length > 1 && (
                <div className="flex justify-end pt-3">
                    <ConfirmationAction
                        onClick={handleAllowAll}
                        disabled={isAllowAllProcessing}
                    >
                        {__('Allow All', 'suggerence')}
                    </ConfirmationAction>
                </div>
            )}
        </div>
    );
};
