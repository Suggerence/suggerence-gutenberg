import { ArrowRight } from 'lucide-react';
import { __ } from '@wordpress/i18n';
import { DrawingToolBase, DrawingContext, ToolSettings } from '@/apps/gutenberg-assistant/components/DrawingCanvas/tools/base';

export class ArrowTool extends DrawingToolBase {
    constructor() {
        super({
            id: 'arrow',
            name: __('Arrow', 'suggerence'),
            icon: <ArrowRight size={20} />,
            group: __('Shapes & Lines', 'suggerence'),
            cursor: 'crosshair',
            showCustomCursor: false,
            defaultSettings: {
                size: 2,
                color: '#000000',
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
                    defaultValue: 2
                },
                {
                    type: 'range',
                    key: 'opacity',
                    label: __('Opacity', 'suggerence'),
                    min: 10,
                    max: 100,
                    step: 5,
                    defaultValue: 100
                },
                {
                    type: 'color',
                    key: 'color',
                    label: __('Color', 'suggerence'),
                    defaultValue: '#000000'
                }
            ]
        });
    }

    onCanvasSetup(ctx: CanvasRenderingContext2D, settings: ToolSettings): void {
        ctx.globalCompositeOperation = 'source-over';
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = settings.color;
        ctx.lineWidth = settings.size;
        ctx.globalAlpha = settings.opacity;
    }

    onStart(context: DrawingContext, settings: ToolSettings): void {
        this.onCanvasSetup?.(context.ctx, settings);
    }

    onMove(context: DrawingContext, settings: ToolSettings): void {
        if (!context.isDrawing || !context.startPoint) return;

        context.ctx.beginPath();

        // Draw arrow line
        context.ctx.moveTo(context.startPoint.x, context.startPoint.y);
        context.ctx.lineTo(context.currentPoint.x, context.currentPoint.y);

        // Calculate arrow head
        const angle = Math.atan2(
            context.currentPoint.y - context.startPoint.y,
            context.currentPoint.x - context.startPoint.x
        );
        const arrowLength = 15;
        const arrowAngle = Math.PI / 6;

        // Draw arrow head
        context.ctx.moveTo(context.currentPoint.x, context.currentPoint.y);
        context.ctx.lineTo(
            context.currentPoint.x - arrowLength * Math.cos(angle - arrowAngle),
            context.currentPoint.y - arrowLength * Math.sin(angle - arrowAngle)
        );
        context.ctx.moveTo(context.currentPoint.x, context.currentPoint.y);
        context.ctx.lineTo(
            context.currentPoint.x - arrowLength * Math.cos(angle + arrowAngle),
            context.currentPoint.y - arrowLength * Math.sin(angle + arrowAngle)
        );

        context.ctx.stroke();
    }

    onStop(context: DrawingContext, settings: ToolSettings): void {
        // Final arrow is already drawn in onMove
    }
}