import { create } from 'zustand';

// Helper function to wrap text within a given width
const wrapText = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] => {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
        const testLine = currentLine + (currentLine ? ' ' : '') + word;
        const metrics = ctx.measureText(testLine);

        if (metrics.width > maxWidth && currentLine) {
            lines.push(currentLine);
            currentLine = word;
        } else {
            currentLine = testLine;
        }
    }

    if (currentLine) {
        lines.push(currentLine);
    }

    return lines.length > 0 ? lines : [''];
};

interface TextRenderStyle {
    fontSize: number;
    fontFamily: string;
    color: string;
    fontWeight: 'normal' | 'bold';
    fontStyle: 'normal' | 'italic';
    textAlign: 'left' | 'center' | 'right';
    lineHeight: number;
    maxWidth: number;
}

interface DrawingCanvasStore {
    // Drawing state
    drawingState: DrawingState;
    canvasHistory: ImageData | null;

    // Text input state
    textInput: string;
    showTextInput: boolean;
    textPosition: { x: number; y: number } | null;

    // Actions
    setCurrentTool: (tool: DrawingTool) => void;
    updateSettings: (settings: Partial<DrawingState>) => void;
    setIsDrawing: (isDrawing: boolean) => void;
    setStartPoint: (point: { x: number; y: number } | undefined) => void;
    saveCanvasHistory: (imageData: ImageData) => void;
    clearCanvasHistory: () => void;

    // Text actions
    setTextInput: (text: string) => void;
    setShowTextInput: (show: boolean) => void;
    setTextPosition: (position: { x: number; y: number } | null) => void;
    addTextToCanvas: (canvasRef: React.RefObject<HTMLCanvasElement>, content: string, style: TextRenderStyle, position: { x: number; y: number }) => void;

    // Utility actions
    resetDrawingState: () => void;
    getToolSettings: () => ToolSettings;
}

const initialDrawingState: DrawingState = {
    currentTool: 'pen',
    penSettings: { size: 2, color: '#000000', opacity: 1 },
    markerSettings: { size: 8, color: '#ffff00', opacity: 0.6 },
    eraserSize: 10,
    lineSettings: { size: 2, color: '#000000', opacity: 1 },
    shapeSettings: { size: 2, color: '#000000', opacity: 1 },
    textSettings: { size: 16, color: '#000000', opacity: 1, fontSize: 16, fontFamily: 'Arial, sans-serif' },
    isDrawing: false,
    startPoint: undefined
};

export const useDrawingCanvasStore = create<DrawingCanvasStore>((set, get) => ({
    // Initial state
    drawingState: initialDrawingState,
    canvasHistory: null,
    textInput: '',
    showTextInput: false,
    textPosition: null,

    // Drawing actions
    setCurrentTool: (tool) =>
        set((state) => ({
            drawingState: { ...state.drawingState, currentTool: tool }
        })),

    updateSettings: (settings) =>
        set((state) => ({
            drawingState: { ...state.drawingState, ...settings }
        })),

    setIsDrawing: (isDrawing) =>
        set((state) => ({
            drawingState: { ...state.drawingState, isDrawing }
        })),

    setStartPoint: (startPoint) =>
        set((state) => ({
            drawingState: { ...state.drawingState, startPoint }
        })),

    saveCanvasHistory: (imageData) =>
        set({ canvasHistory: imageData }),

    clearCanvasHistory: () =>
        set({ canvasHistory: null }),

    // Text actions
    setTextInput: (textInput) => set({ textInput }),

    setShowTextInput: (showTextInput) => set({ showTextInput }),

    setTextPosition: (textPosition) => set({ textPosition }),

    addTextToCanvas: (canvasRef, content, style, position) => {
        const canvas = canvasRef.current;
        if (!canvas || !content.trim()) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Set text properties
        ctx.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize}px ${style.fontFamily}`;
        ctx.fillStyle = style.color;
        ctx.textBaseline = 'top';

        // Handle text alignment and wrapping
        const lines = wrapText(ctx, content, style.maxWidth);
        const lineHeight = style.fontSize * style.lineHeight;

        let startX = position.x;
        if (style.textAlign === 'center') {
            startX = position.x - style.maxWidth / 2;
        } else if (style.textAlign === 'right') {
            startX = position.x - style.maxWidth;
        }

        // Draw each line
        lines.forEach((line, index) => {
            let x = startX;
            if (style.textAlign === 'center') {
                const lineWidth = ctx.measureText(line).width;
                x = startX + (style.maxWidth - lineWidth) / 2;
            } else if (style.textAlign === 'right') {
                const lineWidth = ctx.measureText(line).width;
                x = startX + (style.maxWidth - lineWidth);
            }

            ctx.fillText(line, x, position.y + index * lineHeight);
        });

        // Close text input
        set({ showTextInput: false, textPosition: null });
    },

    // Utility actions
    resetDrawingState: () =>
        set({
            drawingState: { ...initialDrawingState },
            canvasHistory: null,
            textInput: '',
            showTextInput: false,
            textPosition: null
        }),

    getToolSettings: () => {
        const { drawingState } = get();
        switch (drawingState.currentTool) {
            case 'pen': return drawingState.penSettings;
            case 'marker': return drawingState.markerSettings;
            case 'line': return drawingState.lineSettings;
            case 'rectangle':
            case 'circle': return drawingState.shapeSettings;
            case 'text': return drawingState.textSettings;
            default: return drawingState.penSettings;
        }
    }
}));