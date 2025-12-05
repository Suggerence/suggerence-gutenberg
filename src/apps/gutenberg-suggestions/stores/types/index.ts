interface Suggestion {
    id: string;
    blockId: string;
    type: 'alt-text' | 'heading' | 'description';
    message: string;
    suggestedValue: string;
    blockName: string;
}