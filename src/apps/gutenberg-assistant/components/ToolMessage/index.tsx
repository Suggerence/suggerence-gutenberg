import { __experimentalVStack as VStack, __experimentalText as Text, __experimentalHStack as HStack } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
import { getToolDisplayName } from '@/shared/utils/tool-names';
import { ChevronDown, ChevronRight, CheckCircle2, XCircle, Loader2, StopCircle } from 'lucide-react';

export const ToolMessage = ({message}: {message: MCPClientMessage}) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const isError = message.toolResult === 'error';
    const isLoading = message.loading;
    const toolDisplayName = getToolDisplayName(message.toolName || '');

    // Check if tool was stopped by user
    const isStopped = message.content === 'Stopped by user' || message.toolResult === 'Stopped by user';

    // Check if tool result has success: false
    let parsedResult = null;
    let isToolFailure = false;

    if (message.toolResult && typeof message.toolResult === 'string') {
        try {
            parsedResult = JSON.parse(message.toolResult);
            isToolFailure = parsedResult && parsedResult.success === false;
        } catch (e) {
            // If parsing fails, treat as regular string result
        }
    } else if (message.toolResult && typeof message.toolResult === 'object') {
        isToolFailure = message.toolResult.success === false;
    }

    const messageDate = new Date(message.date);
    const timeString = messageDate.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
    });

    const hasError = isError || isToolFailure;

    return (
        <div style={{ width: '100%' }}>
            <VStack spacing={1} justify="start">
                {/* Collapsible Header */}
                <div
                    onClick={() => setIsExpanded(!isExpanded)}
                    style={{
                        padding: '10px 12px',
                        backgroundColor: isStopped ? '#fefce8' : (hasError ? '#fef2f2' : '#f8fafc'),
                        border: `1px solid ${isStopped ? '#fef08a' : (hasError ? '#fecaca' : '#e2e8f0')}`,
                        borderRadius: '8px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        userSelect: 'none'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = isStopped ? '#fef9c3' : (hasError ? '#fee2e2' : '#f1f5f9');
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = isStopped ? '#fefce8' : (hasError ? '#fef2f2' : '#f8fafc');
                    }}
                >
                    <HStack justify="space-between" alignment="center">
                        <HStack spacing={2} alignment="center" justify="start">
                            {/* Status Icon */}
                            {isLoading ? (
                                <Loader2 size={16} style={{ animation: 'spin 1s linear infinite', color: '#64748b' }} />
                            ) : isStopped ? (
                                <StopCircle size={16} style={{ color: '#eab308', flexShrink: 0 }} />
                            ) : hasError ? (
                                <XCircle size={16} style={{ color: '#ef4444', flexShrink: 0 }} />
                            ) : (
                                <CheckCircle2 size={16} style={{ color: '#10b981', flexShrink: 0 }} />
                            )}

                            {/* Tool Name */}
                            <Text
                                size="13"
                                weight="500"
                                style={{
                                    color: isStopped ? '#a16207' : (hasError ? '#dc2626' : '#334155'),
                                    margin: 0
                                }}
                            >
                                {toolDisplayName}
                            </Text>
                        </HStack>

                        {/* Expand Icon */}
                        {isExpanded ? (
                            <ChevronDown size={16} style={{ color: '#94a3b8', flexShrink: 0 }} />
                        ) : (
                            <ChevronRight size={16} style={{ color: '#94a3b8', flexShrink: 0 }} />
                        )}
                    </HStack>
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                    <div
                        style={{
                            padding: '12px',
                            backgroundColor: '#ffffff',
                            border: '1px solid #e2e8f0',
                            borderRadius: '8px',
                            marginTop: '4px'
                        }}
                    >
                        <VStack spacing={3}>
                            {/* Tool Arguments */}
                            <div>
                                <Text
                                    size="11"
                                    weight="600"
                                    style={{
                                        color: '#64748b',
                                        marginBottom: '6px',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.5px'
                                    }}
                                >
                                    {__("Arguments", "suggerence")}
                                </Text>
                                <div
                                    style={{
                                        backgroundColor: '#f8fafc',
                                        border: '1px solid #e2e8f0',
                                        borderRadius: '6px',
                                        padding: '10px',
                                        fontSize: '11px',
                                        fontFamily: '"SF Mono", Monaco, "Cascadia Code", "Roboto Mono", Consolas, "Courier New", monospace',
                                        whiteSpace: 'pre-wrap',
                                        overflow: 'auto',
                                        maxHeight: '200px',
                                        color: '#334155',
                                        lineHeight: '1.6'
                                    }}
                                >
                                    {JSON.stringify(message.toolArgs, null, 2)}
                                </div>
                            </div>

                            {/* Tool Result */}
                            {!isLoading && (
                                <div>
                                    <Text
                                        size="11"
                                        weight="600"
                                        style={{
                                            color: isStopped ? '#a16207' : (hasError ? '#dc2626' : '#0891b2'),
                                            marginBottom: '6px',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.5px'
                                        }}
                                    >
                                        {isStopped ? __("Stopped", "suggerence") : (hasError ? __("Error", "suggerence") : __("Result", "suggerence"))}
                                    </Text>
                                    <div
                                        style={{
                                            backgroundColor: isStopped ? '#fefce8' : (hasError ? '#fef2f2' : '#f0f9ff'),
                                            border: `1px solid ${isStopped ? '#fef08a' : (hasError ? '#fecaca' : '#bae6fd')}`,
                                            borderRadius: '6px',
                                            padding: '10px',
                                            fontSize: '11px',
                                            fontFamily: '"SF Mono", Monaco, "Cascadia Code", "Roboto Mono", Consolas, "Courier New", monospace',
                                            whiteSpace: 'pre-wrap',
                                            overflow: 'auto',
                                            maxHeight: '300px',
                                            color: isStopped ? '#854d0e' : (hasError ? '#991b1b' : '#075985'),
                                            lineHeight: '1.6'
                                        }}
                                    >
                                        {parsedResult ? JSON.stringify(parsedResult, null, 2) : (typeof message.toolResult === 'string' ? message.toolResult : JSON.stringify(message.toolResult, null, 2))}
                                    </div>
                                </div>
                            )}
                        </VStack>
                    </div>
                )}

                <Text variant="muted" size="11" style={{ paddingLeft: '4px' }}>
                    {timeString}
                </Text>
            </VStack>

            <style>
                {`
                    @keyframes spin {
                        from { transform: rotate(0deg); }
                        to { transform: rotate(360deg); }
                    }
                `}
            </style>
        </div>
    );
};