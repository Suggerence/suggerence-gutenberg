export interface AutocompleteState {
    blockId: string | null;
    suggestion: string;
    isGenerating: boolean;
    lastContent: string;
    lastWordCount: number;
}
