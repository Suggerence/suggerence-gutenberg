import { Highlighter } from 'lucide-react';
import { __ } from '@wordpress/i18n';
import { DrawingToolBase, DrawingContext, ToolSettings } from '@/apps/gutenberg-assistant/components/DrawingCanvas/tools/base';

export class MarkerTool extends DrawingToolBase {
    constructor() {
        super({
            id: 'marker',
            name: __('Marker', 'suggerence'),
            icon: <Highlighter size={20} />,
            group: __('Drawing Tools', 'suggerence'),
            cursor: 'none',
            showCustomCursor: true,
            defaultSettings: {
                size: 12,
                color: '#ffff00',
                opacity: 0.5
            },
            settingsControls: [
                {
                    type: 'range',
                    key: 'size',
                    label: __('Size', 'suggerence'),
                    min: 1,
                    max: 50,
                    step: 1,
                    defaultValue: 12
                },
                {
                    type: 'range',
                    key: 'opacity',
                    label: __('Opacity', 'suggerence'),
                    min: 10,
                    max: 100,
                    step: 5,
                    defaultValue: 50
                },
                {
                    type: 'color',
                    key: 'color',
                    label: __('Color', 'suggerence'),
                    defaultValue: '#ffff00'
                }
            ]
        });
    }

    onCanvasSetup(ctx: CanvasRenderingContext2D, settings: ToolSettings): void {
        ctx.globalCompositeOperation = 'source-over';
        ctx.lineCap = 'square';
        ctx.lineJoin = 'miter';
        ctx.strokeStyle = settings.color;
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
            borderRadius: '0' // Square for marker
        };
    }
}