import { useCallback, useEffect } from '@wordpress/element';

export const Canvas = ({
    canvasRef,
    drawingState,
    onStartDrawing,
    onDraw,
    onStopDrawing
}: CanvasProps) => {

    const getCursor = () => {
        switch (drawingState.currentTool) {
            case 'brush':
            case 'marker':
                return 'crosshair';
            case 'eraser':
                return 'grab';
            case 'text':
                return 'text';
            case 'line':
            case 'rectangle':
            case 'circle':
            case 'arrow':
                return 'crosshair';
            default:
                return 'default';
        }
    };

    // Touch support for mobile devices
    const handleTouchStart = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
        e.preventDefault();
        const touch = e.touches[0];
        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const mouseEvent = new MouseEvent('mousedown', {
            clientX: touch.clientX,
            clientY: touch.clientY,
        });

        // Create a synthetic mouse event
        const syntheticEvent = {
            ...mouseEvent,
            clientX: touch.clientX,
            clientY: touch.clientY,
            preventDefault: () => e.preventDefault(),
            stopPropagation: () => e.stopPropagation(),
        } as React.MouseEvent<HTMLCanvasElement>;

        onStartDrawing(syntheticEvent);
    }, [onStartDrawing, canvasRef]);

    const handleTouchMove = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
        e.preventDefault();
        const touch = e.touches[0];

        const syntheticEvent = {
            clientX: touch.clientX,
            clientY: touch.clientY,
            preventDefault: () => e.preventDefault(),
            stopPropagation: () => e.stopPropagation(),
        } as React.MouseEvent<HTMLCanvasElement>;

        onDraw(syntheticEvent);
    }, [onDraw]);

    const handleTouchEnd = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
        e.preventDefault();
        onStopDrawing();
    }, [onStopDrawing]);

    // Initialize canvas with white background when it mounts
    useEffect(() => {
        if (canvasRef.current) {
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                // Set white background
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                // Set initial drawing properties
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
            }
        }
    }, [canvasRef]);

    return (
        <div style={{
            border: '2px solid #ddd',
            borderRadius: '8px',
            backgroundColor: '#fff',
            cursor: getCursor(),
            overflow: 'visible', // Allow text editor to show outside canvas
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            position: 'relative' // Enable absolute positioning for text editor
        }}>
            <canvas
                ref={canvasRef}
                width={720}
                height={480}
                onMouseDown={onStartDrawing}
                onMouseMove={onDraw}
                onMouseUp={onStopDrawing}
                onMouseLeave={onStopDrawing}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onTouchCancel={handleTouchEnd}
                style={{
                    display: 'block',
                    borderRadius: '6px',
                    touchAction: 'none' // Prevent default touch behaviors
                }}
            />
        </div>
    );
};