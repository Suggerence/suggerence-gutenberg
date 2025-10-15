import { Button, __experimentalVStack as VStack, __experimentalHStack as HStack } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { AlertTriangle, ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from '@wordpress/element';
import { getToolDisplayName } from '@/shared/utils/tool-names';

interface ToolConfirmationMessageProps {
    message: MCPClientMessage;
    onAccept: () => void;
    onReject: () => void;
}

export const ToolConfirmationMessage = ({
    message,
    onAccept,
    onReject
}: ToolConfirmationMessageProps) => {
    const [isArgsExpanded, setIsArgsExpanded] = useState(false);

    const cleanToolName = getToolDisplayName(message.toolName || '');

    return (
            <VStack
                spacing={3}
                style={{
                    padding: '14px 16px',
                    border: '1px solid #f0b849',
                    borderRadius: '12px',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                }}
            >
                <HStack spacing={2} alignment="flex-start">
                    <AlertTriangle size={18} color="#d97706" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <VStack spacing={2} style={{ flex: 1 }}>
                        <div style={{
                            fontSize: '13px',
                            fontWeight: 500,
                            color: '#92400e'
                        }}>
                            {cleanToolName}
                        </div>
                    </VStack>
                </HStack>

                {message.toolArgs && Object.keys(message.toolArgs).length > 0 && (
                            <VStack spacing={1} style={{ width: '100%' }}>
                                <button
                                    onClick={() => setIsArgsExpanded(!isArgsExpanded)}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                        background: 'none',
                                        border: 'none',
                                        padding: '4px 0',
                                        cursor: 'pointer',
                                        color: '#78350f',
                                        fontSize: '12px',
                                        fontWeight: 500
                                    }}
                                >
                                    {isArgsExpanded ? (
                                        <ChevronDown size={14} />
                                    ) : (
                                        <ChevronRight size={14} />
                                    )}
                                    {__('Arguments', 'suggerence')} ({Object.keys(message.toolArgs).length})
                                </button>

                                {isArgsExpanded && (
                                    <pre style={{
                                        backgroundColor: '#fef3c7',
                                        padding: '8px 10px',
                                        borderRadius: '6px',
                                        fontSize: '11px',
                                        fontFamily: 'monospace',
                                        color: '#78350f',
                                        maxHeight: '120px',
                                        overflowY: 'auto',
                                        whiteSpace: 'pre-wrap',
                                        wordBreak: 'break-word',
                                        border: '1px solid #fcd34d',
                                        margin: 0
                                    }}>
                                        {JSON.stringify(message.toolArgs, null, 2)}
                                    </pre>
                                )}
                            </VStack>
                        )}

                <HStack spacing={2} style={{ flexShrink: 0, justifyContent: 'flex-end' }}>
                    <Button
                        variant="secondary"
                        size="compact"
                        onClick={onReject}
                        style={{
                            fontSize: '12px',
                            height: '28px',
                        }}
                    >
                        {__('Reject', 'suggerence')}
                    </Button>
                    <Button
                        variant="primary"
                        size="compact"
                        onClick={onAccept}
                        style={{
                            fontSize: '12px',
                            height: '28px',
                        }}
                    >
                        {__('Allow', 'suggerence')}
                    </Button>
                </HStack>
            </VStack>
    );
};
