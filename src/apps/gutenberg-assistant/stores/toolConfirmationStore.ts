import { create } from "zustand";

interface ToolConfirmationStore {
    pendingToolCalls: PendingToolCall[];
    enqueueToolCall: (toolCall: PendingToolCall) => void;
    removeToolCall: (toolCallId: string) => void;
    clearToolCalls: () => void;
    getToolCall: (toolCallId: string) => PendingToolCall | undefined;
    hasPending: () => boolean;
}

export const useToolConfirmationStore = create<ToolConfirmationStore>((set, get) => ({
    pendingToolCalls: [],

    enqueueToolCall: (toolCall) => set((state) => ({
        pendingToolCalls: [...state.pendingToolCalls, toolCall]
    })),

    removeToolCall: (toolCallId) => set((state) => ({
        pendingToolCalls: state.pendingToolCalls.filter(call => call.toolCallId !== toolCallId)
    })),

    clearToolCalls: () => set({ pendingToolCalls: [] }),

    getToolCall: (toolCallId) => get().pendingToolCalls.find(call => call.toolCallId === toolCallId),

    hasPending: () => get().pendingToolCalls.length > 0
}));
