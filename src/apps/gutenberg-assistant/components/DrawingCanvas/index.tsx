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
    SelectControl
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { textColor, check, formatBold, formatItalic } from '@wordpress/icons';
import { CanvasToolbar } from '@/apps/gutenberg-assistant/components/DrawingCanvas/components/CanvasToolbar';
import { Canvas } from '@/apps/gutenberg-assistant/components/DrawingCanvas/components/Canvas';
import { useDrawingCanvasStore } from '@/apps/gutenberg-assistant/components/DrawingCanvas/stores/drawingCanvasStore';
import { toolRegistry } from '@/apps/gutenberg-assistant/components/DrawingCanvas/tools/ToolRegistry';
import type { DrawingContext } from '@/apps/gutenberg-assistant/components/DrawingCanvas/tools/base';

// Import the interface from the store file
interface TextRenderStyle {
    fontSize: number;
    fontFamily: string;
    color: string;
    fontWeight: 'normal' | 'bold';
    fontStyle: 'normal' | 'italic';
    textDecoration: 'none' | 'underline' | 'line-through' | 'overline';
    textAlign: 'left' | 'center' | 'right';
    lineHeight: number;
    maxWidth: number;
}

export const DrawingCanvas = ({ isOpen, onClose, onSave }: DrawingCanvasProps) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Use Zustand store
    const {
        drawingState,
        temporaryCanvasState,
        undoStack,
        redoStack,
        canUndo,
        canRedo,
        textInput,
        showTextInput,
        textPosition,
        setCurrentTool,
        updateSettings,
        setIsDrawing,
        setStartPoint,
        saveTemporaryState,
        clearTemporaryState,
        saveStateToHistory,
        undo,
        redo,
        clearHistory,
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

        // Save state to undo history before starting any drawing operation
        saveStateToHistory(canvasRef);

        // Save temporary canvas state for live preview during shape drawing
        if (['line', 'rectangle', 'circle', 'arrow'].includes(drawingState.currentTool)) {
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            saveTemporaryState(imageData);
        }

        setIsDrawing(true);
        setStartPoint({ x, y });

        // Use tool-specific logic
        const tool = toolRegistry.getTool(drawingState.currentTool);
        if (tool) {
            const settings = getToolSettings();
            const context: DrawingContext = {
                canvas,
                ctx,
                startPoint: { x, y },
                currentPoint: { x, y },
                isDrawing: true
            };
            tool.onStart(context, settings);
        }
    }, [drawingState, saveStateToHistory, setIsDrawing, setStartPoint, getToolSettings]);

    const draw = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!drawingState.isDrawing || !drawingState.startPoint) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Use tool-specific drawing logic
        const tool = toolRegistry.getTool(drawingState.currentTool);
        if (tool) {
            const settings = getToolSettings();
            const context: DrawingContext = {
                canvas,
                ctx,
                startPoint: drawingState.startPoint,
                currentPoint: { x, y },
                isDrawing: drawingState.isDrawing
            };

            // For shape tools, restore canvas from temporary state before drawing preview
            if (['line', 'rectangle', 'circle', 'arrow'].includes(drawingState.currentTool) && temporaryCanvasState) {
                ctx.putImageData(temporaryCanvasState, 0, 0);
            }

            tool.onMove(context, settings);
        }
    }, [drawingState, temporaryCanvasState]);


    const stopDrawing = useCallback(() => {
        if (drawingState.isDrawing && drawingState.startPoint) {
            const canvas = canvasRef.current;
            if (canvas) {
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    const tool = toolRegistry.getTool(drawingState.currentTool);
                    if (tool) {
                        const settings = getToolSettings();
                        const context: DrawingContext = {
                            canvas,
                            ctx,
                            startPoint: drawingState.startPoint,
                            currentPoint: drawingState.startPoint, // Use start point as default
                            isDrawing: false
                        };
                        tool.onStop(context, settings);
                    }
                }
            }
        }

        setIsDrawing(false);
        setStartPoint(undefined);
        // Clear temporary canvas state after shape is finalized
        clearTemporaryState();
    }, [drawingState, getToolSettings, setIsDrawing, setStartPoint, clearTemporaryState, canvasRef]);

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

    const handleUndo = useCallback(() => {
        undo(canvasRef);
    }, [undo, canvasRef]);

    const handleRedo = useCallback(() => {
        redo(canvasRef);
    }, [redo, canvasRef]);

    const handleAddTextToCanvas = useCallback(() => {
        if (!textInput.trim() || !textPosition) return;

        const textSettings = drawingState.textSettings;
        const style: TextRenderStyle = {
            fontSize: textSettings.fontSize,
            fontFamily: textSettings.fontFamily,
            color: textSettings.color,
            fontWeight: (textSettings.fontWeight as 'normal' | 'bold') || 'normal',
            fontStyle: (textSettings.fontStyle as 'normal' | 'italic') || 'normal',
            textDecoration: (textSettings.textDecoration as 'none' | 'underline' | 'line-through' | 'overline') || 'none',
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

    // Keyboard shortcuts for undo/redo
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey && !e.shiftKey && e.key === 'z') {
                e.preventDefault();
                handleUndo();
            } else if (e.ctrlKey && (e.key === 'y' || (e.shiftKey && e.key === 'Z'))) {
                e.preventDefault();
                handleRedo();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, handleUndo, handleRedo]);

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
                <CanvasToolbar
                    drawingState={drawingState}
                    onToolChange={handleToolChange}
                    onSettingsChange={handleSettingsChange}
                    onClearCanvas={clearCanvas}
                    onDownloadCanvas={downloadCanvas}
                    onUndo={handleUndo}
                    onRedo={handleRedo}
                    canUndo={canUndo}
                    canRedo={canRedo}
                />

                <div style={{ position: 'relative' }}>
                    <Canvas
                        canvasRef={canvasRef}
                        drawingState={drawingState}
                        onStartDrawing={startDrawing}
                        onDraw={draw}
                        onStopDrawing={stopDrawing}
                    />

                    {showTextInput && textPosition && (
                        <>
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
                                            label={__('Bold', 'suggerence')}
                                            isPressed={drawingState.textSettings.fontWeight === 'bold'}
                                            onClick={() => updateSettings({
                                                textSettings: { ...drawingState.textSettings, fontWeight: drawingState.textSettings.fontWeight === 'normal' ? 'bold' : 'normal' }
                                            })}
                                        />
                                        <ToolbarButton
                                            icon={formatItalic}
                                            label={__('Italic', 'suggerence')}
                                            isPressed={drawingState.textSettings.fontStyle === 'italic'}
                                            onClick={() => updateSettings({
                                                textSettings: { ...drawingState.textSettings, fontStyle: drawingState.textSettings.fontStyle === 'normal' ? 'italic' : 'normal' }
                                            })}
                                        />
                                        <DropdownMenu
                                            icon={() => (
                                                <span style={{
                                                    fontSize: '16px',
                                                    fontWeight: 'bold',
                                                    textDecoration: drawingState.textSettings.textDecoration !== 'none' ? drawingState.textSettings.textDecoration : 'none'
                                                }}>
                                                    U
                                                </span>
                                            )}
                                            label={__('Text Decoration', 'suggerence')}
                                        >
                                            {() => (
                                                <div style={{ padding: '8px', minWidth: '150px' }}>
                                                    {[
                                                        { label: __('None', 'suggerence'), value: 'none' },
                                                        { label: __('Underline', 'suggerence'), value: 'underline' },
                                                        { label: __('Line Through', 'suggerence'), value: 'line-through' },
                                                        { label: __('Overline', 'suggerence'), value: 'overline' }
                                                    ].map((option) => (
                                                        <button
                                                            key={option.value}
                                                            onClick={() => updateSettings({
                                                                textSettings: { ...drawingState.textSettings, textDecoration: option.value }
                                                            })}
                                                            style={{
                                                                display: 'block',
                                                                width: '100%',
                                                                padding: '8px 12px',
                                                                border: 'none',
                                                                backgroundColor: drawingState.textSettings.textDecoration === option.value ? '#0073aa' : 'transparent',
                                                                color: drawingState.textSettings.textDecoration === option.value ? 'white' : 'inherit',
                                                                cursor: 'pointer',
                                                                borderRadius: '3px',
                                                                textAlign: 'left',
                                                                textDecoration: option.value !== 'none' ? option.value : 'none'
                                                            }}
                                                        >
                                                            {option.label}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </DropdownMenu>
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
                                        fontStyle: drawingState.textSettings.fontStyle,
                                        textDecoration: drawingState.textSettings.textDecoration
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