type DrawingTool = 'brush' | 'marker' | 'eraser' | 'line' | 'rectangle' | 'circle' | 'arrow' | 'text';

interface ToolSettings {
    size: number;
    color: string;
    opacity: number;
}

interface DrawingState {
    currentTool: DrawingTool;
    brushSettings: ToolSettings;
    markerSettings: ToolSettings;
    eraserSize: number;
    lineSettings: ToolSettings;
    shapeSettings: ToolSettings;
    textSettings: ToolSettings & { fontSize: number; fontFamily: string; };
    isDrawing: boolean;
    startPoint?: { x: number; y: number };
}

interface DrawingCanvasProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (imageData: string, description?: string) => void;
}

interface CanvasProps {
    canvasRef: React.RefObject<HTMLCanvasElement>;
    drawingState: DrawingState;
    onStartDrawing: (e: React.MouseEvent<HTMLCanvasElement>) => void;
    onDraw: (e: React.MouseEvent<HTMLCanvasElement>) => void;
    onStopDrawing: () => void;
}

interface ToolbarProps {
    drawingState: DrawingState;
    onToolChange: (tool: DrawingTool) => void;
    onSettingsChange: (settings: Partial<DrawingState>) => void;
    onClearCanvas: () => void;
    onDownloadCanvas: () => void;
}