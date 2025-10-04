import { useCallback, useEffect, useState, useRef } from '@wordpress/element';
import { toolRegistry } from '@/apps/gutenberg-assistant/components/DrawingCanvas/tools/ToolRegistry';

export const Canvas = ({
    canvasRef,
    drawingState,
    onStartDrawing,
    onDraw,
    onStopDrawing
}: CanvasProps) => {
    const [mousePosition, setMousePosition] = useState<{ x: number; y: number } | null>(null);
    const [showCursor, setShowCursor] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const getCurrentTool = () => toolRegistry.getTool(drawingState.currentTool);

    const getCursor = () => {
        const tool = getCurrentTool();
        return tool?.config.cursor || 'default';
    };

    const getToolSize = () => {
        const settingsKey = `${drawingState.currentTool}Settings` as keyof DrawingState;
        const settings = drawingState[settingsKey] as any;
        return settings?.size || 0;
    };

    const getToolColor = () => {
        const settingsKey = `${drawingState.currentTool}Settings` as keyof DrawingState;
        const settings = drawingState[settingsKey] as any;
        if (drawingState.currentTool === 'eraser') {
            return '#ff0000'; // Red for eraser cursor
        }
        return settings?.color || '#000000';
    };

    const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        const container = containerRef.current;
        if (!container || !canvas) return;

        const rect = canvas.getBoundingClientRect();
        
        // No scaling needed - canvas internal size matches display size
        setMousePosition({ 
            x: e.clientX - rect.left, 
            y: e.clientY - rect.top
        });
        onDraw(e);
    }, [onDraw, canvasRef]);

    const handleMouseEnter = useCallback(() => {
        setShowCursor(true);
    }, []);

    const handleMouseLeave = useCallback(() => {
        setShowCursor(false);
        onStopDrawing();
    }, [onStopDrawing]);

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
        } as unknown as React.MouseEvent<HTMLCanvasElement>;

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
        } as unknown as React.MouseEvent<HTMLCanvasElement>;

        onDraw(syntheticEvent);
    }, [onDraw]);

    const handleTouchEnd = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
        e.preventDefault();
        onStopDrawing();
    }, [onStopDrawing]);

    // Dynamically resize canvas to match container size (no scaling/zoom)
    useEffect(() => {
        const resizeCanvas = () => {
            const canvas = canvasRef.current;
            const container = containerRef.current;
            if (!canvas || !container) return;

            const rect = container.getBoundingClientRect();
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            // Save current canvas content
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            
            // Set canvas internal resolution to match display size
            canvas.width = rect.width;
            canvas.height = Math.min(600, rect.width * 0.5625); // 16:9 aspect ratio, max 600px height

            // Restore canvas content (will be stretched/scaled to new size)
            if (imageData.width > 0 && imageData.height > 0) {
                ctx.putImageData(imageData, 0, 0);
            } else {
                // Initialize with white background
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            }

            // Set drawing properties
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
        };

        // Initial resize
        resizeCanvas();

        // Handle window resize
        window.addEventListener('resize', resizeCanvas);
        return () => window.removeEventListener('resize', resizeCanvas);
    }, [canvasRef]);

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

    const shouldShowCustomCursor =
        showCursor &&
        mousePosition &&
        getCurrentTool()?.config.showCustomCursor;

    return (
        <div
            ref={containerRef}
            style={{
                border: '1px solid black',
                backgroundColor: '#fff',
                cursor: getCursor(),
                overflow: 'visible', // Allow text editor to show outside canvas
                position: 'relative', // Enable absolute positioning for text editor
                width: '100%' // Ensure container takes full width
            }}
        >
            <canvas
                ref={canvasRef}
                onMouseDown={onStartDrawing}
                onMouseMove={handleMouseMove}
                onMouseUp={onStopDrawing}
                onMouseLeave={handleMouseLeave}
                onMouseEnter={handleMouseEnter}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onTouchCancel={handleTouchEnd}
                style={{
                    display: 'block',
                    touchAction: 'none' // Prevent default touch behaviors
                }}
            />

            {/* Custom cursor visual */}
            {shouldShowCustomCursor && (
                <div
                    style={{
                        position: 'absolute',
                        left: mousePosition.x - getToolSize() / 2,
                        top: mousePosition.y - getToolSize() / 2,
                        width: getToolSize(),
                        height: getToolSize(),
                        borderRadius: drawingState.currentTool === 'marker' ? '0' : '50%',
                        pointerEvents: 'none',
                        zIndex: 1000,
                        transform: 'translate(-1px, -1px)',
                        boxSizing: 'border-box'
                    }}
                >
                    {/* White dashed border */}
                    <div
                        style={{
                            position: 'absolute',
                            inset: 0,
                            borderRadius: drawingState.currentTool === 'marker' ? '0' : '50%',
                            border: '1px dashed white',
                            boxSizing: 'border-box'
                        }}
                    />
                    {/* Colored dashed border offset */}
                    <div
                        style={{
                            position: 'absolute',
                            inset: 0,
                            borderRadius: drawingState.currentTool === 'marker' ? '0' : '50%',
                            border: drawingState.currentTool === 'eraser'
                                ? '1px dashed #ff0000'
                                : `1px dashed ${getToolColor()}`,
                            boxSizing: 'border-box',
                            transform: 'rotate(180deg)' // Offset the dashes
                        }}
                    />
                    {/* Background */}
                    <div
                        style={{
                            position: 'absolute',
                            inset: '2px',
                            borderRadius: drawingState.currentTool === 'marker' ? '0' : '50%',
                            backgroundColor: drawingState.currentTool === 'eraser'
                                ? 'rgba(255, 0, 0, 0.05)'
                                : drawingState.currentTool === 'marker'
                                    ? `${getToolColor()}20`
                                    : 'rgba(0, 0, 0, 0.05)'
                        }}
                    />
                    {/* Center dot for precision */}
                    <div
                        style={{
                            position: 'absolute',
                            left: '50%',
                            top: '50%',
                            width: '2px',
                            height: '2px',
                            backgroundColor: drawingState.currentTool === 'eraser'
                                ? '#ff0000'
                                : getToolColor(),
                            borderRadius: '50%',
                            transform: 'translate(-50%, -50%)'
                        }}
                    />
                </div>
            )}
        </div>
    );
};