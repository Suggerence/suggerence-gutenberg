import { useRef, useCallback, useEffect } from '@wordpress/element';
import {
    Button,
    Modal,
    __experimentalVStack as VStack,
    __experimentalHStack as HStack,
    Toolbar,
    ToolbarGroup,
    ToolbarButton,
    DropdownMenu,
    ColorPalette,
    RangeControl,
    SelectControl,
    Color
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { textColor, check, formatBold, formatItalic } from '@wordpress/icons';
import { CanvasToolbar } from './components/CanvasToolbar';
import { Canvas } from './components/Canvas';
import { useDrawingCanvasStore } from './stores/drawingCanvasStore';

// Import the interface from the store file
interface TextRenderStyle {
    fontSize: number;
    fontFamily: string;
    color: string;
    fontWeight: 'normal' | 'bold';
    fontStyle: 'normal' | 'italic';
    textAlign: 'left' | 'center' | 'right';
    lineHeight: number;
    maxWidth: number;
}

export const DrawingCanvas = ({ isOpen, onClose, onSave }: DrawingCanvasProps) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Use Zustand store
    const {
        drawingState,
        canvasHistory,
        textInput,
        showTextInput,
        textPosition,
        setCurrentTool,
        updateSettings,
        setIsDrawing,
        setStartPoint,
        saveCanvasHistory,
        clearCanvasHistory,
        setTextInput,
        setShowTextInput,
        setTextPosition,
        addTextToCanvas,
        resetDrawingState,
        getToolSettings
    } = useDrawingCanvasStore();


    const startDrawing = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Handle text tool
        if (drawingState.currentTool === 'text') {
            setTextPosition({ x, y });
            setShowTextInput(true);
            return;
        }

        // Save canvas state before drawing shapes (for live preview)
        if (['line', 'rectangle', 'circle', 'arrow'].includes(drawingState.currentTool)) {
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            saveCanvasHistory(imageData);
        }

        setIsDrawing(true);
        setStartPoint({ x, y });

        const settings = getToolSettings();

        if (drawingState.currentTool === 'eraser') {
            ctx.globalCompositeOperation = 'destination-out';
            ctx.lineWidth = drawingState.eraserSize;
        } else {
            ctx.globalCompositeOperation = 'source-over';
            ctx.strokeStyle = settings.color;
            ctx.lineWidth = settings.size;
            ctx.globalAlpha = settings.opacity;
        }

        // Set tool-specific properties
        switch (drawingState.currentTool) {
            case 'marker':
                ctx.lineCap = 'square';
                ctx.lineJoin = 'miter';
                break;
            default:
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
        }

        // Start drawing path for freehand tools
        if (['brush', 'marker', 'eraser'].includes(drawingState.currentTool)) {
            ctx.beginPath();
            ctx.moveTo(x, y);
        }
    }, [drawingState, saveCanvasHistory, setIsDrawing, setStartPoint, getToolSettings]);

    const draw = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!drawingState.isDrawing || !drawingState.startPoint) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Handle different drawing tools
        switch (drawingState.currentTool) {
            case 'brush':
            case 'marker':
            case 'eraser':
                // Freehand drawing
                ctx.lineTo(x, y);
                ctx.stroke();
                break;

            case 'line':
            case 'rectangle':
            case 'circle':
            case 'arrow':
                // Shape drawing - restore canvas and draw preview
                if (canvasHistory) {
                    ctx.putImageData(canvasHistory, 0, 0);
                }
                drawShape(ctx, drawingState.startPoint.x, drawingState.startPoint.y, x, y);
                break;
        }
    }, [drawingState, canvasHistory]);

    const drawShape = (ctx: CanvasRenderingContext2D, startX: number, startY: number, endX: number, endY: number) => {
        const settings = getToolSettings();
        ctx.strokeStyle = settings.color;
        ctx.lineWidth = settings.size;
        ctx.globalAlpha = settings.opacity;
        ctx.beginPath();

        switch (drawingState.currentTool) {
            case 'line':
                ctx.moveTo(startX, startY);
                ctx.lineTo(endX, endY);
                break;

            case 'rectangle':
                const width = endX - startX;
                const height = endY - startY;
                ctx.rect(startX, startY, width, height);
                break;

            case 'circle':
                const radius = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
                ctx.arc(startX, startY, radius, 0, 2 * Math.PI);
                break;

            case 'arrow':
                // Draw arrow line
                ctx.moveTo(startX, startY);
                ctx.lineTo(endX, endY);

                // Draw arrow head
                const angle = Math.atan2(endY - startY, endX - startX);
                const arrowLength = 15;
                const arrowAngle = Math.PI / 6;

                ctx.moveTo(endX, endY);
                ctx.lineTo(
                    endX - arrowLength * Math.cos(angle - arrowAngle),
                    endY - arrowLength * Math.sin(angle - arrowAngle)
                );
                ctx.moveTo(endX, endY);
                ctx.lineTo(
                    endX - arrowLength * Math.cos(angle + arrowAngle),
                    endY - arrowLength * Math.sin(angle + arrowAngle)
                );
                break;
        }

        ctx.stroke();
    };

    const stopDrawing = useCallback(() => {
        setIsDrawing(false);
        setStartPoint(undefined);
        // Clear canvas history after shape is finalized
        clearCanvasHistory();
    }, [setIsDrawing, setStartPoint, clearCanvasHistory]);

    const clearCanvas = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Set white background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }, []);

    const downloadCanvas = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const link = document.createElement('a');
        link.download = `drawing-${Date.now()}.png`;
        link.href = canvas.toDataURL();
        link.click();
    }, []);

    const handleSave = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const imageData = canvas.toDataURL('image/png');
        onSave(imageData, 'Hand-drawn diagram or sketch');
        onClose();
    }, [onSave, onClose]);

    const handleToolChange = useCallback((tool: DrawingTool) => {
        setCurrentTool(tool);
    }, [setCurrentTool]);

    const handleSettingsChange = useCallback((settings: Partial<DrawingState>) => {
        updateSettings(settings);
    }, [updateSettings]);

    const handleAddTextToCanvas = useCallback(() => {
        if (!textInput.trim() || !textPosition) return;

        const textSettings = drawingState.textSettings;
        const style: TextRenderStyle = {
            fontSize: textSettings.fontSize,
            fontFamily: textSettings.fontFamily,
            color: textSettings.color,
            fontWeight: 'normal',
            fontStyle: 'normal',
            textAlign: 'left',
            lineHeight: 1.2,
            maxWidth: 300,
        };

        addTextToCanvas(canvasRef, textInput, style, textPosition);
    }, [textInput, textPosition, drawingState.textSettings, addTextToCanvas]);


    // Initialize canvas with white background
    useEffect(() => {
        if (isOpen && canvasRef.current) {
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            }
        }
    }, [isOpen]);

    // Reset state when modal closes
    useEffect(() => {
        if (!isOpen) {
            resetDrawingState();
        }
    }, [isOpen, resetDrawingState]);

    if (!isOpen) return null;

    return (
        <Modal
            title={__('Enhanced Drawing Canvas', 'suggerence')}
            onRequestClose={onClose}
            style={{ maxWidth: '900px', width: '95vw' }}
            shouldCloseOnClickOutside={false}
            className="suggerence-gutenberg-assistant-modal"
        >
            <VStack spacing={4}>
                {/* Enhanced Toolbar */}
                <CanvasToolbar
                    drawingState={drawingState}
                    onToolChange={handleToolChange}
                    onSettingsChange={handleSettingsChange}
                    onClearCanvas={clearCanvas}
                    onDownloadCanvas={downloadCanvas}
                />


                {/* Canvas with embedded TextEditor */}
                <div style={{ position: 'relative' }}>
                    <Canvas
                        canvasRef={canvasRef}
                        drawingState={drawingState}
                        onStartDrawing={startDrawing}
                        onDraw={draw}
                        onStopDrawing={stopDrawing}
                    />

                    {/* Text Editor positioned relative to Canvas */}
                    {showTextInput && textPosition && (
                        <>
                            {/* Floating Toolbar - appears above textarea */}
                            <div
                                style={{
                                    position: 'absolute',
                                    left: textPosition.x,
                                    top: textPosition.y - 70,
                                    zIndex: 10000
                                }}
                            >
                                <Toolbar label={__('Text Formatting', 'suggerence')}>
                                    <ToolbarGroup>
                                        <DropdownMenu
                                            icon={() => <span style={{ fontSize: '12px', fontWeight: 'bold' }}>Aa</span>}
                                            label={__('Font', 'suggerence')}
                                        >
                                            {() => (
                                                <div style={{ padding: '16px', minWidth: '200px' }}>
                                                    <SelectControl
                                                        label={__('Font Family', 'suggerence')}
                                                        value={drawingState.textSettings.fontFamily}
                                                        options={[
                                                            { label: 'Arial', value: 'Arial, sans-serif' },
                                                            { label: 'Times New Roman', value: 'Times New Roman, serif' },
                                                            { label: 'Courier New', value: 'Courier New, monospace' },
                                                            { label: 'Georgia', value: 'Georgia, serif' },
                                                            { label: 'Verdana', value: 'Verdana, sans-serif' }
                                                        ]}
                                                        onChange={(value) => updateSettings({
                                                            textSettings: { ...drawingState.textSettings, fontFamily: value }
                                                        })}
                                                    />
                                                    <RangeControl
                                                        __nextHasNoMarginBottom={true}
                                                        __next40pxDefaultSize={true}
                                                        label={__('Font Size', 'suggerence')}
                                                        value={drawingState.textSettings.fontSize}
                                                        onChange={(value) => updateSettings({
                                                            textSettings: { ...drawingState.textSettings, fontSize: value || 16 }
                                                        })}
                                                        min={8}
                                                        max={72}
                                                        step={1}
                                                    />
                                                </div>
                                            )}
                                        </DropdownMenu>
                                    </ToolbarGroup>

                                    <ToolbarGroup>
                                        <ToolbarButton
                                            icon={formatBold}
                                            label={__('Font Weight', 'suggerence')}
                                            onClick={() => updateSettings({
                                                textSettings: { ...drawingState.textSettings, fontWeight: drawingState.textSettings.fontWeight === 'normal' ? 'bold' : 'normal' }
                                            })}
                                        >
                                        </ToolbarButton>
                                        <ToolbarButton
                                            icon={formatItalic}
                                            label={__('Font Style', 'suggerence')}
                                            onClick={() => updateSettings({
                                                textSettings: { ...drawingState.textSettings, fontStyle: drawingState.textSettings.fontStyle === 'normal' ? 'italic' : 'normal' }
                                            })}
                                        >
                                        </ToolbarButton>

                                    </ToolbarGroup>

                                    <ToolbarGroup>
                                        <DropdownMenu
                                            icon={textColor}
                                            label={__('Text Color', 'suggerence')}
                                        >
                                            {() => (
                                                <div style={{ padding: '16px', minWidth: '200px' }}>
                                                    <ColorPalette
                                                        colors={[
                                                            { name: 'Black', color: '#000000' },
                                                            { name: 'Red', color: '#ff0000' },
                                                            { name: 'Blue', color: '#0000ff' },
                                                            { name: 'Green', color: '#00ff00' },
                                                            { name: 'Yellow', color: '#ffff00' },
                                                            { name: 'Orange', color: '#ffa500' },
                                                            { name: 'Purple', color: '#800080' },
                                                            { name: 'White', color: '#ffffff' },
                                                            { name: 'Gray', color: '#808080' }
                                                        ]}
                                                        value={drawingState.textSettings.color}
                                                        onChange={(color?: string) => {
                                                            const newColor = color || '#000000';
                                                            updateSettings({
                                                                textSettings: { ...drawingState.textSettings, color: newColor }
                                                            });
                                                        }}
                                                    />
                                                </div>
                                            )}
                                        </DropdownMenu>
                                    </ToolbarGroup>

                                    <ToolbarGroup>
                                        <ToolbarButton
                                            icon={check}
                                            label={__('Apply Text', 'suggerence')}
                                            onClick={handleAddTextToCanvas}
                                            disabled={!textInput.trim()}
                                        />
                                    </ToolbarGroup>
                                </Toolbar>
                            </div>

                            {/* Simple Textarea */}
                            <div
                                style={{
                                    position: 'absolute',
                                    left: textPosition.x,
                                    top: textPosition.y,
                                    zIndex: 9999
                                }}
                            >
                                <textarea
                                    value={textInput}
                                    onChange={(e) => setTextInput(e.target.value)}
                                    placeholder={__('Type your text here...', 'suggerence')}
                                    autoFocus
                                    rows={1}
                                    style={{
                                        minWidth: '200px',
                                        border: 'none',
                                        borderRadius: '0px',
                                        padding: '0px',
                                        outline: 'none',
                                        resize: 'none',
                                        fontSize: `${drawingState.textSettings.fontSize}px`,
                                        fontFamily: drawingState.textSettings.fontFamily,
                                        color: drawingState.textSettings.color,
                                        backgroundColor: 'transparent',
                                        fontWeight: drawingState.textSettings.fontWeight,
                                        fontStyle: drawingState.textSettings.fontStyle
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && e.ctrlKey) {
                                            e.preventDefault();
                                            handleAddTextToCanvas();
                                        } else if (e.key === 'Escape') {
                                            setShowTextInput(false);
                                            setTextInput('');
                                            setTextPosition(null);
                                        }
                                    }}
                                />
                            </div>
                        </>
                    )}
                </div>

                {/* Action Buttons */}
                <HStack justify="end" spacing={2}>
                    <Button
                        variant="tertiary"
                        onClick={onClose}
                    >
                        {__('Cancel', 'suggerence')}
                    </Button>

                    <Button
                        variant="primary"
                        onClick={handleSave}
                    >
                        {__('Add to Context', 'suggerence')}
                    </Button>
                </HStack>
            </VStack>
        </Modal>
    );
};