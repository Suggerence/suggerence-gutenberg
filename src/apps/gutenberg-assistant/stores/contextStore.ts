import { create } from 'zustand';
import { calculateContextUsage } from '@/shared/utils/contextCalculator';

export const useContextStore = create<ContextState>((set, get) => ({
    selectedContexts: [],
    contextUsage: null,

    addContext: (context: SelectedContext) => set((state) => {
        // Remove any existing context of the same type (except for blocks which can have multiple)
        const filteredContexts = context.type === 'block'
            ? state.selectedContexts.filter(ctx => ctx.id !== context.id)
            : state.selectedContexts.filter(ctx => ctx.type !== context.type);

        const newContexts = [...filteredContexts, context];
        console.log('Added context:', context, 'Total contexts:', newContexts.length);

        return {
            selectedContexts: newContexts
        };
    }),

    removeContext: (contextId: string) => set((state) => {
        const newContexts = state.selectedContexts.filter(ctx => ctx.id !== contextId);
        console.log('Removed context:', contextId, 'Remaining contexts:', newContexts.length);

        return {
            selectedContexts: newContexts
        };
    }),

    clearContexts: () => set({ selectedContexts: [] }),

    getContextsByType: (type: string) => {
        return get().selectedContexts.filter(ctx => ctx.type === type);
    },

    hasContext: (type: string) => {
        return get().selectedContexts.some(ctx => ctx.type === type);
    },

    updateContextUsage: (params: {
        messages: MCPClientMessage[];
        systemPrompt: string;
        gutenbergContext: any;
    }) => {
        const { selectedContexts } = get();
        const usage = calculateContextUsage({
            ...params,
            selectedContexts
        });
        set({ contextUsage: usage });
    }
}));