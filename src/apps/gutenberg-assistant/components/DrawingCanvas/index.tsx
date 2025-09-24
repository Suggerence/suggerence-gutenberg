import { useState, useRef, useCallback, useEffect } from '@wordpress/element';
import {
    Button,
    Modal,
    __experimentalVStack as VStack,
    __experimentalHStack as HStack,
    Toolbar,
    ToolbarGroup,
    ToolbarButton,
    DropdownMenu,
    CircularOptionPicker,
    RangeControl
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { edit, brush, download, trash, color, settings } from '@wordpress/icons';

interface DrawingCanvasProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (imageData: string, description?: string) => void;
}

export const DrawingCanvas = ({ isOpen, onClose, onSave }: DrawingCanvasProps) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [currentTool, setCurrentTool] = useState<'pen' | 'eraser'>('pen');
    const [penSize, setPenSize] = useState(2);
    const [eraserSize, setEraserSize] = useState(10);
    const [penColor, setPenColor] = useState('#000000');

    // Generate color options with current selection
    const getColorOptions = useCallback(() => [
        { name: 'Black', style: { backgroundColor: '#000000' }, isSelected: penColor === '#000000', value: '#000000' },
        { name: 'Red', style: { backgroundColor: '#ff0000' }, isSelected: penColor === '#ff0000', value: '#ff0000' },
        { name: 'Blue', style: { backgroundColor: '#0000ff' }, isSelected: penColor === '#0000ff', value: '#0000ff' },
        { name: 'Green', style: { backgroundColor: '#00ff00' }, isSelected: penColor === '#00ff00', value: '#00ff00' },
        { name: 'Yellow', style: { backgroundColor: '#ffff00' }, isSelected: penColor === '#ffff00', value: '#ffff00' },
        { name: 'Orange', style: { backgroundColor: '#ffa500' }, isSelected: penColor === '#ffa500', value: '#ffa500' },
        { name: 'Purple', style: { backgroundColor: '#800080' }, isSelected: penColor === '#800080', value: '#800080' },
        { name: 'White', style: { backgroundColor: '#ffffff', border: '1px solid #ddd' }, isSelected: penColor === '#ffffff', value: '#ffffff' }
    ], [penColor]);

    const startDrawing = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        setIsDrawing(true);

        if (currentTool === 'pen') {
            ctx.globalCompositeOperation = 'source-over';
            ctx.strokeStyle = penColor;
            ctx.lineWidth = penSize;
        } else {
            ctx.globalCompositeOperation = 'destination-out';
            ctx.lineWidth = eraserSize;
        }

        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(x, y);
    }, [currentTool, penColor, penSize, eraserSize]);

    const draw = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isDrawing) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.lineTo(x, y);
        ctx.stroke();
    }, [isDrawing]);

    const stopDrawing = useCallback(() => {
        setIsDrawing(false);
    }, []);

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

    if (!isOpen) return null;

    return (
        <Modal
            title={__('Drawing Canvas', 'suggerence')}
            onRequestClose={onClose}
            style={{ maxWidth: '800px', width: '90vw' }}
            shouldCloseOnClickOutside={false}
        >
            <VStack spacing={4}>
                {/* Drawing Toolbar */}
                <Toolbar label={__('Drawing Tools', 'suggerence')}>
                    <ToolbarGroup>
                        <ToolbarButton
                            icon={brush}
                            label={__('Pen', 'suggerence')}
                            isPressed={currentTool === 'pen'}
                            onClick={() => setCurrentTool('pen')}
                        />
                        <ToolbarButton
                            icon={edit}
                            label={__('Eraser', 'suggerence')}
                            isPressed={currentTool === 'eraser'}
                            onClick={() => setCurrentTool('eraser')}
                        />
                    </ToolbarGroup>

                    {currentTool === 'pen' && (
                        <ToolbarGroup>
                            <DropdownMenu
                                icon={color}
                                label={__('Color', 'suggerence')}
                            >
                                {() => (
                                    <div style={{ padding: '16px', minWidth: '200px' }}>
                                        <CircularOptionPicker
                                            options={getColorOptions()}
                                            value={penColor}
                                            onChangeValue={(newColor: string) => setPenColor(newColor)}
                                        />
                                    </div>
                                )}
                            </DropdownMenu>

                            <DropdownMenu
                                icon={settings}
                                label={__('Brush Size', 'suggerence')}
                            >
                                {() => (
                                    <div style={{ padding: '16px', minWidth: '200px' }}>
                                        <RangeControl
                                            __nextHasNoMarginBottom={true}
                                            __next40pxDefaultSize={true}
                                            label={__('Brush Size', 'suggerence')}
                                            value={penSize}
                                            onChange={(value) => setPenSize(value || 1)}
                                            min={1}
                                            max={20}
                                            step={1}
                                            renderTooltipContent={(value) => `${value}px`}
                                        />
                                    </div>
                                )}
                            </DropdownMenu>
                        </ToolbarGroup>
                    )}

                    {currentTool === 'eraser' && (
                        <ToolbarGroup>
                            <DropdownMenu
                                icon={settings}
                                label={__('Eraser Size', 'suggerence')}
                            >
                                {() => (
                                    <div style={{ padding: '16px', minWidth: '200px' }}>
                                        <RangeControl
                                            __nextHasNoMarginBottom={true}
                                            __next40pxDefaultSize={true}
                                            label={__('Eraser Size', 'suggerence')}
                                            value={eraserSize}
                                            onChange={(value) => setEraserSize(value || 5)}
                                            min={5}
                                            max={50}
                                            step={1}
                                            renderTooltipContent={(value) => `${value}px`}
                                        />
                                    </div>
                                )}
                            </DropdownMenu>
                        </ToolbarGroup>
                    )}

                    <ToolbarGroup>
                        <ToolbarButton
                            icon={download}
                            label={__('Download', 'suggerence')}
                            onClick={downloadCanvas}
                        />
                        <ToolbarButton
                            icon={trash}
                            label={__('Clear Canvas', 'suggerence')}
                            onClick={clearCanvas}
                        />
                    </ToolbarGroup>
                </Toolbar>

                {/* Canvas */}
                <div style={{
                    border: '2px solid #ddd',
                    borderRadius: '8px',
                    backgroundColor: '#fff',
                    cursor: currentTool === 'pen' ? 'crosshair' : 'grab'
                }}>
                    <canvas
                        ref={canvasRef}
                        width={720}
                        height={360}
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                        style={{
                            display: 'block',
                            borderRadius: '6px'
                        }}
                    />
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