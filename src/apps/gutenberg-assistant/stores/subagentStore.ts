import { create } from 'zustand';

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

interface SubagentStore {
    subagents: Record<string, SubagentStatus>;
    activeOrchestratorId: string | null;

    // Actions
    setSubagentStatus: (subagentId: string, agentType: string, status: SubagentStatus['status']) => void;
    setSubagentTool: (subagentId: string, toolName: string) => void;
    addSubagentThinking: (subagentId: string, thinking: string) => void;
    addSubagentToolCall: (subagentId: string, toolCall: SubagentToolCall) => void;
    setSubagentToolResult: (subagentId: string, toolCallId: string, result: string) => void;
    setSubagentFinalResult: (subagentId: string, result: string) => void;
    clearSubagents: () => void;
    setActiveOrchestrator: (orchestratorId: string | null) => void;
    getActiveSubagents: () => SubagentStatus[];
}

export const useSubagentStore = create<SubagentStore>((set, get) => ({
    subagents: {},
    activeOrchestratorId: null,

    setSubagentStatus: (subagentId, agentType, status) => {
        set((state) => ({
            subagents: {
                ...state.subagents,
                [subagentId]: {
                    ...state.subagents[subagentId],
                    subagentId,
                    agentType,
                    status,
                    toolCalls: state.subagents[subagentId]?.toolCalls || [],
                }
            }
        }));
    },

    setSubagentTool: (subagentId, toolName) => {
        set((state) => ({
            subagents: {
                ...state.subagents,
                [subagentId]: {
                    ...state.subagents[subagentId],
                    currentTool: toolName
                }
            }
        }));
    },

    addSubagentThinking: (subagentId, thinking) => {
        set((state) => ({
            subagents: {
                ...state.subagents,
                [subagentId]: {
                    ...state.subagents[subagentId],
                    thinking: (state.subagents[subagentId]?.thinking || '') + thinking
                }
            }
        }));
    },

    addSubagentToolCall: (subagentId, toolCall) => {
        set((state) => ({
            subagents: {
                ...state.subagents,
                [subagentId]: {
                    ...state.subagents[subagentId],
                    toolCalls: [...(state.subagents[subagentId]?.toolCalls || []), toolCall]
                }
            }
        }));
    },

    setSubagentToolResult: (subagentId, toolCallId, result) => {
        set((state) => ({
            subagents: {
                ...state.subagents,
                [subagentId]: {
                    ...state.subagents[subagentId],
                    toolCalls: state.subagents[subagentId]?.toolCalls.map(tc =>
                        tc.id === toolCallId ? { ...tc, result } : tc
                    ) || []
                }
            }
        }));
    },

    setSubagentFinalResult: (subagentId, result) => {
        set((state) => ({
            subagents: {
                ...state.subagents,
                [subagentId]: {
                    ...state.subagents[subagentId],
                    finalResult: result
                }
            }
        }));
    },

    clearSubagents: () => {
        set({ subagents: {}, activeOrchestratorId: null });
    },

    setActiveOrchestrator: (orchestratorId) => {
        set({ activeOrchestratorId: orchestratorId });
    },

    getActiveSubagents: () => {
        const state = get();
        return Object.values(state.subagents);
    }
}));
