import { Type } from 'lucide-react';
import { __ } from '@wordpress/i18n';
import { DrawingToolBase, DrawingContext, ToolSettings } from '@/apps/gutenberg-assistant/components/DrawingCanvas/tools/base';

export class TextTool extends DrawingToolBase {
    constructor() {
        super({
            id: 'text',
            name: __('Text', 'suggerence'),
            icon: <Type size={20} />,
            group: __('Text', 'suggerence'),
            cursor: 'text',
            showCustomCursor: false,
            defaultSettings: {
                size: 16,
                color: '#000000',
                opacity: 1,
                fontSize: 16,
                fontFamily: 'Arial, sans-serif',
                fontWeight: 'normal',
                fontStyle: 'normal',
                textDecoration: 'none'
            },
            settingsControls: [
                {
                    type: 'range',
                    key: 'size',
                    label: __('Font Size', 'suggerence'),
                    min: 8,
                    max: 72,
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
                },
            ]
        });
    }

    onCanvasSetup(ctx: CanvasRenderingContext2D, settings: ToolSettings): void {
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = settings.color;
        ctx.globalAlpha = settings.opacity;
        ctx.font = `${settings.fontStyle || 'normal'} ${settings.fontWeight || 'normal'} ${settings.size}px ${settings.fontFamily}`;
        ctx.textBaseline = 'top';
    }

    onStart(context: DrawingContext, settings: ToolSettings): void {
        // Text tool doesn't draw immediately on start
        // This will trigger text input UI in the component
    }

    onMove(context: DrawingContext, settings: ToolSettings): void {
        // Text tool doesn't need move behavior
    }

    onStop(context: DrawingContext, settings: ToolSettings): void {
        // Text tool doesn't need stop behavior
    }

    // Special method for text rendering
    renderText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, settings: ToolSettings): void {
        this.onCanvasSetup?.(ctx, settings);

        const lines = this.wrapText(ctx, text, 300);
        const lineHeight = settings.size * 1.2;

        lines.forEach((line, index) => {
            ctx.fillText(line, x, y + index * lineHeight);
        });
    }

    private wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
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
    }
}