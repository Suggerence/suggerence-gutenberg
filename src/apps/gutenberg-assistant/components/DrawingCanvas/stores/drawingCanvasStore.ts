import { create } from 'zustand';
import { toolRegistry } from '../tools/ToolRegistry';

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
    textDecoration: 'none' | 'underline' | 'line-through' | 'overline';
    textAlign: 'left' | 'center' | 'right';
    lineHeight: number;
    maxWidth: number;
}

interface DrawingCanvasStore {
    // Drawing state
    drawingState: DrawingState;
    temporaryCanvasState: ImageData | null;

    // Undo/Redo state
    undoStack: ImageData[];
    redoStack: ImageData[];
    canUndo: boolean;
    canRedo: boolean;

    // Text input state
    textInput: string;
    showTextInput: boolean;
    textPosition: { x: number; y: number } | null;

    // Actions
    setCurrentTool: (tool: DrawingTool) => void;
    updateSettings: (settings: Partial<DrawingState>) => void;
    setIsDrawing: (isDrawing: boolean) => void;
    setStartPoint: (point: { x: number; y: number } | undefined) => void;
    saveTemporaryState: (imageData: ImageData) => void;
    clearTemporaryState: () => void;

    // Text actions
    setTextInput: (text: string) => void;
    setShowTextInput: (show: boolean) => void;
    setTextPosition: (position: { x: number; y: number } | null) => void;
    addTextToCanvas: (canvasRef: React.RefObject<HTMLCanvasElement>, content: string, style: TextRenderStyle, position: { x: number; y: number }) => void;

    // Undo/Redo actions
    saveStateToHistory: (canvasRef: React.RefObject<HTMLCanvasElement>) => void;
    undo: (canvasRef: React.RefObject<HTMLCanvasElement>) => void;
    redo: (canvasRef: React.RefObject<HTMLCanvasElement>) => void;
    clearHistory: () => void;
    loadPersistedCanvas: (canvasRef: React.RefObject<HTMLCanvasElement>) => void;
    persistCanvas: (canvasRef: React.RefObject<HTMLCanvasElement>) => void;

    // Utility actions
    resetDrawingState: () => void;
    getToolSettings: () => ToolSettings;
}

const createInitialDrawingState = (): DrawingState => {
    const defaultSettings = toolRegistry.getDefaultSettings();
    return {
        currentTool: 'brush',
        ...defaultSettings,
        isDrawing: false,
        startPoint: undefined
    } as DrawingState;
};

const initialDrawingState = createInitialDrawingState();

export const useDrawingCanvasStore = create<DrawingCanvasStore>((set, get) => ({
    // Initial state
    drawingState: initialDrawingState,
    temporaryCanvasState: null,

    // Undo/Redo state
    undoStack: [],
    redoStack: [],
    canUndo: false,
    canRedo: false,

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

    saveTemporaryState: (imageData) =>
        set({ temporaryCanvasState: imageData }),

    clearTemporaryState: () =>
        set({ temporaryCanvasState: null }),

    // Text actions
    setTextInput: (textInput) => set({ textInput }),

    setShowTextInput: (showTextInput) => set({ showTextInput }),

    setTextPosition: (textPosition) => set({ textPosition }),

    addTextToCanvas: (canvasRef, content, style, position) => {
        const canvas = canvasRef.current;
        if (!canvas || !content.trim()) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Save state before adding text for undo functionality
        const state = get();
        const imageDataBeforeText = ctx.getImageData(0, 0, canvas.width, canvas.height);
        set({
            undoStack: [...state.undoStack, imageDataBeforeText],
            redoStack: [],
            canUndo: true,
            canRedo: false
        });

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
            const lineWidth = ctx.measureText(line).width;

            if (style.textAlign === 'center') {
                x = startX + (style.maxWidth - lineWidth) / 2;
            } else if (style.textAlign === 'right') {
                x = startX + (style.maxWidth - lineWidth);
            }

            const y = position.y + index * lineHeight;

            // Draw the text
            ctx.fillText(line, x, y);

            // Draw text decoration if specified
            if (style.textDecoration && style.textDecoration !== 'none') {
                const lineThickness = Math.max(1, style.fontSize / 16);
                ctx.strokeStyle = ctx.fillStyle;
                ctx.lineWidth = lineThickness;

                ctx.beginPath();
                switch (style.textDecoration) {
                    case 'underline':
                        const underlineY = y + style.fontSize + lineThickness;
                        ctx.moveTo(x, underlineY);
                        ctx.lineTo(x + lineWidth, underlineY);
                        break;
                    case 'line-through':
                        const strikeY = y + style.fontSize / 2;
                        ctx.moveTo(x, strikeY);
                        ctx.lineTo(x + lineWidth, strikeY);
                        break;
                    case 'overline':
                        const overlineY = y - lineThickness;
                        ctx.moveTo(x, overlineY);
                        ctx.lineTo(x + lineWidth, overlineY);
                        break;
                }
                ctx.stroke();
            }
        });

            // Close text input
        set({ showTextInput: false, textPosition: null });
    },

    // Utility actions
    // Undo/Redo actions
    saveStateToHistory: (canvasRef) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const state = get();

        set({
            undoStack: [...state.undoStack, imageData],
            redoStack: [], // Clear redo stack when new action is performed
            canUndo: true,
            canRedo: false
        });
    },

    undo: (canvasRef) => {
        const state = get();
        const canvas = canvasRef.current;

        if (!canvas || state.undoStack.length === 0) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Save current state to redo stack
        const currentImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

        // Get previous state from undo stack
        const newUndoStack = [...state.undoStack];
        const previousState = newUndoStack.pop()!;

        // Apply previous state to canvas
        ctx.putImageData(previousState, 0, 0);

        set({
            undoStack: newUndoStack,
            redoStack: [...state.redoStack, currentImageData],
            canUndo: newUndoStack.length > 0,
            canRedo: true
        });
    },

    redo: (canvasRef) => {
        const state = get();
        const canvas = canvasRef.current;

        if (!canvas || state.redoStack.length === 0) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Save current state to undo stack
        const currentImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

        // Get next state from redo stack
        const newRedoStack = [...state.redoStack];
        const nextState = newRedoStack.pop()!;

        // Apply next state to canvas
        ctx.putImageData(nextState, 0, 0);

        set({
            undoStack: [...state.undoStack, currentImageData],
            redoStack: newRedoStack,
            canUndo: true,
            canRedo: newRedoStack.length > 0
        });
    },

    clearHistory: () => {
        set({
            undoStack: [],
            redoStack: [],
            canUndo: false,
            canRedo: false
        });
    },

    loadPersistedCanvas: (canvasRef) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        try {
            const canvasData = localStorage.getItem('suggerenceDrawingCanvas');
            if (canvasData) {
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    const img = new Image();
                    img.onload = () => {
                        // Clear canvas and draw the loaded image scaled to current canvas size
                        ctx.clearRect(0, 0, canvas.width, canvas.height);
                        ctx.fillStyle = '#ffffff';
                        ctx.fillRect(0, 0, canvas.width, canvas.height);
                        
                        // Draw the image scaled to fit the current canvas dimensions
                        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                        
                        // Save this state to undo history
                        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                        set({
                            undoStack: [imageData],
                            redoStack: [],
                            canUndo: true,
                            canRedo: false
                        });
                    };
                    img.src = canvasData;
                }
            } else {
                // No persisted data, set white background
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.fillStyle = '#ffffff';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                }
            }
        } catch (error) {
            console.warn('Failed to load canvas data from localStorage:', error);
            // Set white background on error
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            }
        }
    },

    persistCanvas: (canvasRef) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        try {
            const canvasData = canvas.toDataURL('image/png');
            localStorage.setItem('suggerenceDrawingCanvas', canvasData);
        } catch (error) {
            console.warn('Failed to persist canvas data to localStorage:', error);
        }
    },

    resetDrawingState: () =>
        set({
            drawingState: createInitialDrawingState(),
            temporaryCanvasState: null,
            undoStack: [],
            redoStack: [],
            canUndo: false,
            canRedo: false,
            textInput: '',
            showTextInput: false,
            textPosition: null
        }),

    getToolSettings: () => {
        const { drawingState } = get();
        switch (drawingState.currentTool) {
            case 'brush': return drawingState.brushSettings;
            case 'marker': return drawingState.markerSettings;
            case 'eraser': return drawingState.eraserSettings;
            case 'line': return drawingState.lineSettings;
            case 'rectangle': return drawingState.rectangleSettings;
            case 'circle': return drawingState.circleSettings;
            case 'arrow': return drawingState.arrowSettings;
            case 'text': return drawingState.textSettings;
            case 'move': return drawingState.moveSettings as any;
            default: return drawingState.brushSettings;
        }
    }
}));