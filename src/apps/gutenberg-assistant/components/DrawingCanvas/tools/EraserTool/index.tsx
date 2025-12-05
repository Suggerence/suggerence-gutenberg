import { Eraser } from 'lucide-react';
import { __ } from '@wordpress/i18n';
import { DrawingToolBase, DrawingContext, ToolSettings } from '@/apps/gutenberg-assistant/components/DrawingCanvas/tools/base';

export class EraserTool extends DrawingToolBase {
    constructor() {
        super({
            id: 'eraser',
            name: __('Eraser', 'suggerence'),
            icon: <Eraser size={20} />,
            group: __('Drawing Tools', 'suggerence'),
            cursor: 'none',
            showCustomCursor: true,
            defaultSettings: {
                size: 16,
                opacity: 1
            },
            settingsControls: [
                {
                    type: 'range',
                    key: 'size',
                    label: __('Size', 'suggerence'),
                    min: 1,
                    max: 50,
                    step: 1,
                    defaultValue: 16
                },
                {
                    type: 'range',
                    key: 'opacity',
                    label: __('Opacity', 'suggerence'),
                    min: 10,
                    max: 100,
                    step: 5,
                    defaultValue: 100
                }
            ]
        });
    }

    onCanvasSetup(ctx: CanvasRenderingContext2D, settings: ToolSettings): void {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.lineWidth = settings.size;
        ctx.globalAlpha = settings.opacity;
    }

    onStart(context: DrawingContext, settings: ToolSettings): void {
        this.onCanvasSetup?.(context.ctx, settings);
        context.ctx.beginPath();
        context.ctx.moveTo(context.currentPoint.x, context.currentPoint.y);
    }

    onMove(context: DrawingContext, settings: ToolSettings): void {
        if (!context.isDrawing) return;
        context.ctx.lineTo(context.currentPoint.x, context.currentPoint.y);
        context.ctx.stroke();
    }

    onStop(context: DrawingContext, settings: ToolSettings): void {
        // No special cleanup needed
    }

    getCustomCursorStyle(settings: ToolSettings): React.CSSProperties {
        return {
            width: settings.size,
            height: settings.size,
            borderRadius: '50%'
        };
    }
}