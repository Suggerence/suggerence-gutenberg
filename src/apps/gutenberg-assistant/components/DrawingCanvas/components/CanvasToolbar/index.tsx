import {
    Toolbar,
    ToolbarGroup,
    ToolbarButton,
    DropdownMenu,
    ColorPalette,
    RangeControl,
    SelectControl
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import {
    brush,
    edit,
    download,
    trash,
    color,
    settings,
    formatBold,
    wordpress
} from '@wordpress/icons';
import {
    Pen,
    Highlighter,
    Minus,
    Square,
    Circle,
    ArrowRight,
    Type,
    Eraser
} from 'lucide-react';

const colorOptions = [
    { name: 'Black', color: '#000000' },
    { name: 'Red', color: '#ff0000' },
    { name: 'Blue', color: '#0000ff' },
    { name: 'Green', color: '#00ff00' },
    { name: 'Yellow', color: '#ffff00' },
    { name: 'Orange', color: '#ffa500' },
    { name: 'Purple', color: '#800080' },
    { name: 'White', color: '#ffffff' },
    { name: 'Gray', color: '#808080' },
    { name: 'Pink', color: '#ffc0cb' },
    { name: 'Brown', color: '#8b4513' },
    { name: 'Cyan', color: '#00ffff' }
];

const fontOptions = [
    { label: 'Arial', value: 'Arial, sans-serif' },
    { label: 'Times New Roman', value: 'Times New Roman, serif' },
    { label: 'Courier New', value: 'Courier New, monospace' },
    { label: 'Georgia', value: 'Georgia, serif' },
    { label: 'Verdana', value: 'Verdana, sans-serif' },
    { label: 'Comic Sans MS', value: 'Comic Sans MS, cursive' }
];

export const CanvasToolbar = ({
    drawingState,
    onToolChange,
    onSettingsChange,
    onClearCanvas,
    onDownloadCanvas
}: ToolbarProps) => {

    // Get current tool settings
    const getCurrentSettings = (): ToolSettings => {
        switch (drawingState.currentTool) {
            case 'pen': return drawingState.penSettings;
            case 'marker': return drawingState.markerSettings;
            case 'line': return drawingState.lineSettings;
            case 'rectangle':
            case 'circle': return drawingState.shapeSettings;
            case 'text': return drawingState.textSettings;
            default: return drawingState.penSettings;
        }
    };

    const getToolIcon = (tool: DrawingTool) => {
        switch (tool) {
            case 'pen': return <Pen size={20} />;
            case 'marker': return <Highlighter size={20} />;
            case 'eraser': return <Eraser size={20} />;
            case 'line': return <Minus size={20} />;
            case 'rectangle': return <Square size={20} />;
            case 'circle': return <Circle size={20} />;
            case 'arrow': return <ArrowRight size={20} />;
            case 'text': return <Type size={20} />;
            default: return brush;
        }
    };


    const updateCurrentToolSettings = (newSettings: Partial<ToolSettings>) => {
        const tool = drawingState.currentTool;

        if (tool === 'eraser') {
            if ('size' in newSettings) {
                onSettingsChange({ eraserSize: newSettings.size! });
            }
            return;
        }

        const settingsKey = `${tool}Settings` as keyof DrawingState;
        const currentSettings = getCurrentSettings();

        onSettingsChange({
            [settingsKey]: { ...currentSettings, ...newSettings }
        } as Partial<DrawingState>);
    };

    const toolGroups = [
        {
            label: __('Drawing Tools', 'suggerence'),
            tools: [
                { tool: 'pen' as DrawingTool, label: __('Pen', 'suggerence') },
                { tool: 'marker' as DrawingTool, label: __('Marker', 'suggerence') },
                { tool: 'eraser' as DrawingTool, label: __('Eraser', 'suggerence') }
            ]
        },
        {
            label: __('Shapes & Lines', 'suggerence'),
            tools: [
                { tool: 'line' as DrawingTool, label: __('Line', 'suggerence') },
                { tool: 'rectangle' as DrawingTool, label: __('Rectangle', 'suggerence') },
                { tool: 'circle' as DrawingTool, label: __('Circle', 'suggerence') },
                { tool: 'arrow' as DrawingTool, label: __('Arrow', 'suggerence') }
            ]
        },
        {
            label: __('Text', 'suggerence'),
            tools: [
                { tool: 'text' as DrawingTool, label: __('Text', 'suggerence') }
            ]
        }
    ];

    return (
        <Toolbar label={__('Drawing Tools', 'suggerence')}>
            {/* Tool Selection */}
            <ToolbarGroup>
                <DropdownMenu
                    icon={getToolIcon(drawingState.currentTool)}
                    label={__('Select Tool', 'suggerence')}
                    popoverProps={{ placement: 'bottom-start' }}
                >
                    {({ onClose }) => (
                        <div style={{ padding: '8px', minWidth: '200px' }}>
                            {toolGroups.map((group, groupIndex) => (
                                <div key={groupIndex} style={{ marginBottom: '12px' }}>
                                    <div style={{
                                        fontSize: '12px',
                                        fontWeight: 'bold',
                                        color: '#666',
                                        marginBottom: '4px',
                                        textTransform: 'uppercase'
                                    }}>
                                        {group.label}
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px' }}>
                                        {group.tools.map((toolItem) => (
                                            <button
                                                key={toolItem.tool}
                                                onClick={() => {
                                                    onToolChange(toolItem.tool);
                                                    onClose();
                                                }}
                                                style={{
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    alignItems: 'center',
                                                    padding: '8px 4px',
                                                    border: drawingState.currentTool === toolItem.tool ? '2px solid #0073aa' : '1px solid #ddd',
                                                    borderRadius: '4px',
                                                    backgroundColor: drawingState.currentTool === toolItem.tool ? '#f0f8ff' : 'white',
                                                    cursor: 'pointer',
                                                    fontSize: '10px',
                                                    gap: '2px'
                                                }}
                                            >
                                                {getToolIcon(toolItem.tool)}
                                                <span>{toolItem.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </DropdownMenu>
            </ToolbarGroup>

            {/* Tool Settings */}
            {drawingState.currentTool !== 'eraser' && (
                <ToolbarGroup>
                    <DropdownMenu
                        icon={color}
                        label={__('Color', 'suggerence')}
                    >
                        {() => (
                            <div style={{ padding: '16px', minWidth: '200px' }}>
                                <ColorPalette
                                    colors={colorOptions}
                                    value={getCurrentSettings().color}
                                    onChange={(newColor?: string) => updateCurrentToolSettings({ color: newColor || '#000000' })}
                                />
                            </div>
                        )}
                    </DropdownMenu>

                    <DropdownMenu
                        icon={settings}
                        label={__('Size & Opacity', 'suggerence')}
                    >
                        {() => (
                            <div style={{ padding: '16px', minWidth: '200px' }}>
                                <RangeControl
                                    __nextHasNoMarginBottom={true}
                                    __next40pxDefaultSize={true}
                                    label={__('Size', 'suggerence')}
                                    value={getCurrentSettings().size}
                                    onChange={(value) => updateCurrentToolSettings({ size: value || 1 })}
                                    min={1}
                                    max={drawingState.currentTool === 'text' ? 72 : 50}
                                    step={1}
                                    renderTooltipContent={(value) => `${value}px`}
                                />
                                <RangeControl
                                    __nextHasNoMarginBottom={true}
                                    __next40pxDefaultSize={true}
                                    label={__('Opacity', 'suggerence')}
                                    value={Math.round(getCurrentSettings().opacity * 100)}
                                    onChange={(value) => updateCurrentToolSettings({ opacity: (value || 100) / 100 })}
                                    min={10}
                                    max={100}
                                    step={5}
                                    renderTooltipContent={(value) => `${value}%`}
                                />
                            </div>
                        )}
                    </DropdownMenu>
                </ToolbarGroup>
            )}

            {/* Eraser Settings */}
            {drawingState.currentTool === 'eraser' && (
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
                                    value={drawingState.eraserSize}
                                    onChange={(value) => onSettingsChange({ eraserSize: value || 5 })}
                                    min={5}
                                    max={100}
                                    step={1}
                                    renderTooltipContent={(value) => `${value}px`}
                                />
                            </div>
                        )}
                    </DropdownMenu>
                </ToolbarGroup>
            )}

            {/* Actions */}
            <ToolbarGroup>
                <ToolbarButton
                    icon={download}
                    label={__('Download', 'suggerence')}
                    onClick={onDownloadCanvas}
                />
                <ToolbarButton
                    icon={trash}
                    label={__('Clear Canvas', 'suggerence')}
                    onClick={onClearCanvas}
                />
            </ToolbarGroup>
        </Toolbar>
    );
};