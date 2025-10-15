import { __experimentalText as Text, __experimentalHStack as HStack, __experimentalVStack as VStack, Spinner } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
import { Lightbulb, CheckCircle2, Circle, ChevronDown, ChevronRight, Loader2 } from 'lucide-react';

interface ReasoningMessageProps {
    message: MCPClientMessage;
}

export const ReasoningMessage = ({ message }: ReasoningMessageProps) => {
    const [isExpanded, setIsExpanded] = useState(false); // Default expanded to show the plan
    const { reasoning } = message;

    if (!reasoning) return null;

    const getTaskStatusIcon = (status: string) => {
        switch (status) {
            case 'completed':
                return <CheckCircle2 size={14} style={{ color: '#10b981', flexShrink: 0 }} />;
            case 'in_progress':
                return <Loader2 size={14} style={{ animation: 'spin 1s linear infinite', color: '#3b82f6', flexShrink: 0 }} />;
            case 'failed':
                return <Circle size={14} style={{ color: '#ef4444', flexShrink: 0 }} />;
            default:
                return <Circle size={14} style={{ color: '#94a3b8', flexShrink: 0 }} />;
        }
    };

    const getTaskStatusColor = (status: string) => {
        switch (status) {
            case 'completed':
                return '#10b981';
            case 'in_progress':
                return '#3b82f6';
            case 'failed':
                return '#ef4444';
            default:
                return '#64748b';
        }
    };

    // Count tasks by status
    const taskCounts = reasoning.plan?.reduce((acc, task) => {
        acc[task.status] = (acc[task.status] || 0) + 1;
        return acc;
    }, {} as Record<string, number>) || {};

    const totalTasks = reasoning.plan?.length || 0;
    const completedTasks = taskCounts.completed || 0;
    const pendingTasks = taskCounts.pending || 0;
    const inProgressTasks = taskCounts.in_progress || 0;

    return (
        <div style={{ width: '100%' }}>
            {/* Collapsible Header */}
            <div
                onClick={() => setIsExpanded(!isExpanded)}
                style={{
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    userSelect: 'none'
                }}
            >
                <HStack justify="start" alignment="center">
                    <HStack spacing={2} alignment="center" justify="start">
                        {/* Icon */}
                        <Lightbulb size={16} style={{ color: '#f59e0b', flexShrink: 0 }} />

                        {/* Status Text */}
                        <Text
                            size="13"
                            weight="500"
                            style={{
                                margin: 0,
                                color: '#64748b'
                            }}
                        >
                            {__('Plan', 'suggerence')}
                            {/* {totalTasks > 0 && (
                                <span style={{ marginLeft: '6px', fontSize: '12px', color: '#94a3b8' }}>
                                    ({completedTasks}/{totalTasks})
                                </span>
                            )} */}
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
                        {/* Analysis */}
                        {reasoning.analysis && (
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
                                    {__('Analysis', 'suggerence')}
                                </Text>
                                <div
                                    style={{
                                        backgroundColor: '#f8fafc',
                                        border: '1px solid #e2e8f0',
                                        borderRadius: '6px',
                                        padding: '10px',
                                        fontSize: '12px',
                                        color: '#475569',
                                        lineHeight: '1.6'
                                    }}
                                >
                                    {reasoning.analysis}
                                </div>
                            </div>
                        )}

                        {/* Task List */}
                        {/* {reasoning.plan && reasoning.plan.length > 0 && (
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
                                    {__('Tasks', 'suggerence')}
                                </Text>
                                <VStack spacing={2}>
                                    {reasoning.plan
                                        .sort((a, b) => a.order - b.order)
                                        .map((task) => (
                                            <HStack
                                                key={task.id}
                                                spacing={2}
                                                alignment="flex-start"
                                                style={{
                                                    padding: '8px 10px',
                                                    backgroundColor: '#f8fafc',
                                                    borderRadius: '6px',
                                                    border: '1px solid #e2e8f0',
                                                    transition: 'all 0.2s ease'
                                                }}
                                            >
                                                {getTaskStatusIcon(task.status)}
                                                <Text
                                                    style={{
                                                        fontSize: '12px',
                                                        lineHeight: '1.5',
                                                        color: getTaskStatusColor(task.status),
                                                        flex: 1,
                                                        textDecoration: task.status === 'completed' ? 'line-through' : 'none',
                                                        opacity: task.status === 'completed' ? 0.7 : 1
                                                    }}
                                                >
                                                    {task.description}
                                                </Text>
                                            </HStack>
                                        ))}
                                </VStack>
                            </div>
                        )} */}

                        {/* Reflection */}
                        {/* {reasoning.reflection && (
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
                                    {__('Reflection', 'suggerence')}
                                </Text>
                                <div
                                    style={{
                                        padding: '10px',
                                        backgroundColor: '#f8fafc',
                                        borderRadius: '6px',
                                        border: '1px solid #e2e8f0',
                                        borderLeft: '3px solid #f59e0b'
                                    }}
                                >
                                    <Text
                                        style={{
                                            fontSize: '12px',
                                            fontStyle: 'italic',
                                            lineHeight: '1.5',
                                            color: '#64748b'
                                        }}
                                    >
                                        {reasoning.reflection}
                                    </Text>
                                </div>
                            </div>
                        )} */}
                    </VStack>
                </div>
            )}

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
