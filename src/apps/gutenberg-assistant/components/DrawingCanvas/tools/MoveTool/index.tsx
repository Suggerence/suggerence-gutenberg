import { Move } from 'lucide-react';
import { __ } from '@wordpress/i18n';
import { DrawingToolBase, DrawingContext, ToolSettings } from '@/apps/gutenberg-assistant/components/DrawingCanvas/tools/base';

export class MoveTool extends DrawingToolBase {
    private dragStartPoint: { x: number; y: number } | null = null;
    private canvasSnapshot: ImageData | null = null;
    private isDragging = false;

    constructor() {
        super({
            id: 'move',
            name: __('Move', 'suggerence'),
            icon: <Move size={20} />,
            group: __('Selection', 'suggerence'),
            cursor: 'move',
            showCustomCursor: false,
            defaultSettings: {},
            settingsControls: []
        });
    }

    onCanvasSetup(ctx: CanvasRenderingContext2D, settings: ToolSettings): void {
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 1;
    }

    onStart(context: DrawingContext, settings: ToolSettings): void {
        const { ctx, startPoint, canvas } = context;

        // Store the starting point for drag calculation
        this.dragStartPoint = { ...startPoint };

        // Take a snapshot of the current canvas
        this.canvasSnapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
        this.isDragging = true;
    }

    onMove(context: DrawingContext, settings: ToolSettings): void {
        if (!this.isDragging || !this.dragStartPoint || !this.canvasSnapshot) return;

        const { ctx, currentPoint, canvas } = context;

        // Calculate the drag offset
        const deltaX = currentPoint.x - this.dragStartPoint.x;
        const deltaY = currentPoint.y - this.dragStartPoint.y;

        // Clear the canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Set white background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw the snapshot at the new position
        ctx.putImageData(this.canvasSnapshot, deltaX, deltaY);
    }

    onStop(context: DrawingContext, settings: ToolSettings): void {
        this.isDragging = false;
        this.dragStartPoint = null;
        this.canvasSnapshot = null;
    }
}