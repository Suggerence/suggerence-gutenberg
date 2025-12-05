import { ReactNode } from 'react';

export interface ToolSettings {
    [key: string]: any;
}

export interface DrawingContext {
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    startPoint?: { x: number; y: number };
    currentPoint: { x: number; y: number };
    isDrawing: boolean;
}

export interface SettingsControl {
    type: 'range' | 'color' | 'select' | 'toggle';
    key: string;
    label: string;
    min?: number;
    max?: number;
    step?: number;
    options?: { label: string; value: any }[];
    defaultValue?: any;
}

export interface DrawingToolConfig {
    id: string;
    name: string;
    icon: ReactNode;
    group: string;
    cursor: string;
    defaultSettings: ToolSettings;
    settingsControls: SettingsControl[];
    showCustomCursor?: boolean;
}


export abstract class DrawingToolBase {
    public readonly config: DrawingToolConfig;

    constructor(config: DrawingToolConfig) {
        this.config = config;
    }

    abstract onStart(context: DrawingContext, settings: ToolSettings): void;
    abstract onMove(context: DrawingContext, settings: ToolSettings): void;
    abstract onStop(context: DrawingContext, settings: ToolSettings): void;

    onCanvasSetup?(ctx: CanvasRenderingContext2D, settings: ToolSettings): void;
    getCustomCursorStyle?(settings: ToolSettings): React.CSSProperties;
    validateSettings?(settings: ToolSettings): ToolSettings;
}