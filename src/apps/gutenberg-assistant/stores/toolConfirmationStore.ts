import { create } from "zustand";

interface ToolConfirmationStore {
    pendingToolCall: PendingToolCall | null;
    setPendingToolCall: (toolCall: PendingToolCall | null) => void;
    clearPendingToolCall: () => void;
}

export const useToolConfirmationStore = create<ToolConfirmationStore>((set) => ({
    pendingToolCall: null,
    setPendingToolCall: (toolCall) => set({ pendingToolCall: toolCall }),
    clearPendingToolCall: () => set({ pendingToolCall: null }),
}));
