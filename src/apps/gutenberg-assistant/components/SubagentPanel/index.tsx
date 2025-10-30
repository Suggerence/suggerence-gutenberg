import { createElement, useState } from '@wordpress/element';
import { Loader2, CheckCircle2, XCircle, Clock, Sparkles, ChevronDown, ChevronRight } from 'lucide-react';

interface SubagentToolCall {
    id: string;
    name: string;
    input: any;
    result?: string;
}

interface SubagentStatus {
    subagentId: string;
    agentType: string;
    status: 'pending' | 'running' | 'waiting_for_tool' | 'completed' | 'failed';
    currentTool?: string;
    thinking?: string;
    toolCalls: SubagentToolCall[];
    finalResult?: string;
}

interface SubagentPanelProps {
    subagents: SubagentStatus[];
}

const agentTypeLabels: Record<string, { label: string; icon: string; color: string }> = {
    layout_researcher: {
        label: 'Scout',
        icon: '🎨',
        color: 'text-purple-600'
    },
    content_creator: {
        label: 'Cre8',
        icon: '✨',
        color: 'text-blue-600'
    },
    block_executor: {
        label: 'Brik',
        icon: '⚡',
        color: 'text-green-600'
    },
    style_designer: {
        label: 'S-Tyler',
        icon: '🎯',
        color: 'text-pink-600'
    }
};

const getStatusIcon = (status: SubagentStatus['status']) => {
    switch (status) {
        case 'pending':
            return <Clock className="w-4 h-4 text-gray-400" />;
        case 'running':
            return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
        case 'waiting_for_tool':
            return <Sparkles className="w-4 h-4 text-yellow-500 animate-pulse" />;
        case 'completed':
            return <CheckCircle2 className="w-4 h-4 text-green-500" />;
        case 'failed':
            return <XCircle className="w-4 h-4 text-red-500" />;
        default:
            return <Clock className="w-4 h-4 text-gray-400" />;
    }
};

const getStatusText = (status: SubagentStatus['status']) => {
    switch (status) {
        case 'pending':
            return 'Waiting...';
        case 'running':
            return 'Working';
        case 'waiting_for_tool':
            return 'Executing tool';
        case 'completed':
            return 'Complete';
        case 'failed':
            return 'Failed';
        default:
            return '';
    }
};

const SubagentCard = ({ subagent }: { subagent: SubagentStatus }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    const typeInfo = agentTypeLabels[subagent.agentType] || {
        label: subagent.agentType,
        icon: '🤖',
        color: 'text-gray-600'
    };

    const hasDetails = subagent.thinking || subagent.toolCalls.length > 0 || subagent.finalResult;

    return (
        <div
            className={`
                rounded-md border transition-all duration-200
                ${subagent.status === 'completed'
                    ? 'bg-green-50 border-green-200'
                    : subagent.status === 'failed'
                    ? 'bg-red-50 border-red-200'
                    : subagent.status === 'running' || subagent.status === 'waiting_for_tool'
                    ? 'bg-white border-blue-300 shadow-sm'
                    : 'bg-gray-50 border-gray-200'
                }
            `}
        >
            <div
                className="p-2 flex items-center gap-2 cursor-pointer hover:bg-black/5"
                onClick={() => hasDetails && setIsExpanded(!isExpanded)}
            >
                <span className="text-lg">{typeInfo.icon}</span>
                <div className="flex-1 min-w-0">
                    <div className={`text-xs font-medium ${typeInfo.color} truncate`}>
                        {typeInfo.label}
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                        {getStatusIcon(subagent.status)}
                        <span className="text-xs text-gray-600">
                            {getStatusText(subagent.status)}
                        </span>
                    </div>
                    {subagent.currentTool && (
                        <div className="text-xs text-gray-500 mt-0.5 truncate">
                            {subagent.currentTool.replace('gutenberg___', '')}
                        </div>
                    )}
                </div>
                {hasDetails && (
                    <button className="p-1 hover:bg-black/10 rounded">
                        {isExpanded ?
                            <ChevronDown className="w-4 h-4 text-gray-500" /> :
                            <ChevronRight className="w-4 h-4 text-gray-500" />
                        }
                    </button>
                )}
            </div>

            {isExpanded && hasDetails && (
                <div className="px-2 pb-2 space-y-2 text-xs">
                    {subagent.thinking && (
                        <div className="bg-white/50 p-2 rounded border border-gray-200">
                            <div className="font-semibold text-gray-700 mb-1">Thinking</div>
                            <div className="text-gray-600 whitespace-pre-wrap font-mono text-xs">
                                {subagent.thinking}
                            </div>
                        </div>
                    )}

                    {subagent.toolCalls.length > 0 && (
                        <div className="bg-white/50 p-2 rounded border border-gray-200">
                            <div className="font-semibold text-gray-700 mb-1">
                                Tool Calls ({subagent.toolCalls.length})
                            </div>
                            <div className="space-y-1">
                                {subagent.toolCalls.map((tc) => (
                                    <div key={tc.id} className="border-l-2 border-blue-300 pl-2">
                                        <div className="font-medium text-blue-700">
                                            {tc.name.replace('gutenberg___', '')}
                                        </div>
                                        {tc.result && (
                                            <div className="text-gray-500 mt-0.5 truncate">
                                                ✓ Completed
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {subagent.finalResult && (
                        <div className="bg-white/50 p-2 rounded border border-gray-200">
                            <div className="font-semibold text-gray-700 mb-1">Result</div>
                            <div className="text-gray-600 whitespace-pre-wrap">
                                {subagent.finalResult.substring(0, 200)}
                                {subagent.finalResult.length > 200 && '...'}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export const SubagentPanel = ({ subagents }: SubagentPanelProps) => {
    if (subagents.length === 0) return null;

    return (
        <div className="my-3 p-3 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-semibold text-gray-700">
                    Multi-Agent Execution
                </span>
                <span className="text-xs text-gray-500">
                    ({subagents.filter(s => s.status === 'completed').length}/{subagents.length} complete)
                </span>
            </div>

            <div className="grid grid-cols-1 gap-2">
                {subagents.map((subagent) => (
                    <SubagentCard key={subagent.subagentId} subagent={subagent} />
                ))}
            </div>
        </div>
    );
};
