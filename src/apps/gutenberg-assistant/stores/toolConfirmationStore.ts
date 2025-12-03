import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface ToolConfirmationStore {
    pendingToolCalls: PendingToolCall[];
    enqueueToolCall: (toolCall: PendingToolCall) => void;
    removeToolCall: (toolCallId: string) => void;
    clearToolCalls: () => void;
    getToolCall: (toolCallId: string) => PendingToolCall | undefined;
    hasPending: () => boolean;
    alwaysAllowTools: string[];
    addAlwaysAllowTool: (toolName: string) => void;
    isToolAlwaysAllowed: (toolName: string) => boolean;
}

export const useToolConfirmationStore = create<ToolConfirmationStore>()(
    persist(
        (set, get) => ({
            pendingToolCalls: [],
            alwaysAllowTools: [],

            enqueueToolCall: (toolCall) => set((state) => ({
                pendingToolCalls: [...state.pendingToolCalls, toolCall]
            })),

            removeToolCall: (toolCallId) => set((state) => ({
                pendingToolCalls: state.pendingToolCalls.filter(call => call.toolCallId !== toolCallId)
            })),

            clearToolCalls: () => set({ pendingToolCalls: [] }),

            getToolCall: (toolCallId) => get().pendingToolCalls.find(call => call.toolCallId === toolCallId),

            hasPending: () => get().pendingToolCalls.length > 0,

            addAlwaysAllowTool: (toolName) => set((state) => ({
                alwaysAllowTools: state.alwaysAllowTools.includes(toolName)
                    ? state.alwaysAllowTools
                    : [...state.alwaysAllowTools, toolName]
            })),

            isToolAlwaysAllowed: (toolName) => get().alwaysAllowTools.includes(toolName)
        }),
        {
            name: 'suggerenceToolConfirmationReferences',
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                alwaysAllowTools: state.alwaysAllowTools
            })
        }
    )
);
