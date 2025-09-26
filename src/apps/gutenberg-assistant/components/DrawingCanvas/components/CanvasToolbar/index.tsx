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
    download,
    trash,
    settings,
    undo,
    redo
} from '@wordpress/icons';
import { toolRegistry } from '@/apps/gutenberg-assistant/components/DrawingCanvas/tools/ToolRegistry';

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


export const CanvasToolbar = ({
    drawingState,
    onToolChange,
    onSettingsChange,
    onClearCanvas,
    onDownloadCanvas,
    onUndo,
    onRedo,
    canUndo,
    canRedo
}: ToolbarProps) => {
    const currentTool = toolRegistry.getTool(drawingState.currentTool);
    const toolGroupsMap = toolRegistry.getToolGroups();
    const toolGroupsArray = Array.from(toolGroupsMap.entries()).map(([groupName, tools]) => ({
        label: groupName,
        tools
    }));

    // Get current tool settings
    const getCurrentSettings = () => {
        const settingsKey = `${drawingState.currentTool}Settings` as keyof DrawingState;
        return drawingState[settingsKey] || {};
    };

    const updateCurrentToolSettings = (newSettings: any) => {
        const tool = drawingState.currentTool;
        const settingsKey = `${tool}Settings` as keyof DrawingState;
        const currentSettings = getCurrentSettings();

        onSettingsChange({
            [settingsKey]: { ...currentSettings, ...newSettings }
        } as Partial<DrawingState>);
    };

    const renderSettingControl = (control: any, currentSettings: any) => {
        switch (control.type) {
            case 'range':
                const value = control.key === 'opacity' && typeof currentSettings[control.key] === 'number'
                    ? Math.round(currentSettings[control.key] * 100)
                    : currentSettings[control.key] || control.defaultValue;

                return (
                    <RangeControl
                        key={control.key}
                        __nextHasNoMarginBottom={true}
                        __next40pxDefaultSize={true}
                        label={control.label}
                        value={value}
                        onChange={(newValue) => {
                            const finalValue = control.key === 'opacity'
                                ? (newValue || 100) / 100
                                : newValue || control.defaultValue;
                            updateCurrentToolSettings({ [control.key]: finalValue });
                        }}
                        min={control.min}
                        max={control.max}
                        step={control.step}
                        renderTooltipContent={(value) => control.key === 'opacity' ? `${value}%` : `${value}px`}
                    />
                );

            case 'color':
                return (
                    <ColorPalette
                        key={control.key}
                        colors={colorOptions}
                        value={currentSettings[control.key] || control.defaultValue}
                        onChange={(newColor) => updateCurrentToolSettings({ [control.key]: newColor || control.defaultValue })}
                    />
                );

            case 'select':
                return (
                    <SelectControl
                        key={control.key}
                        label={control.label}
                        value={currentSettings[control.key] || control.defaultValue}
                        options={control.options}
                        onChange={(value) => updateCurrentToolSettings({ [control.key]: value })}
                    />
                );

            case 'toggle':
                const isActive = currentSettings[control.key] !== 'normal' && currentSettings[control.key] !== control.defaultValue;
                return (
                    <ToolbarButton
                        key={control.key}
                        label={control.label}
                        isPressed={isActive}
                        onClick={() => {
                            const newValue = isActive ? 'normal' : (control.key === 'fontWeight' ? 'bold' : 'italic');
                            updateCurrentToolSettings({ [control.key]: newValue });
                        }}
                    >
                        {control.label}
                    </ToolbarButton>
                );

            default:
                return null;
        }
    };

    return (
        <Toolbar label={__('Drawing Tools', 'suggerence')}>
            {/* Tool Selection */}
            <ToolbarGroup>
                <DropdownMenu
                    icon={currentTool?.config.icon || settings}
                    label={__('Select Tool', 'suggerence')}
                    popoverProps={{ placement: 'bottom-start' }}
                >
                    {({ onClose }) => (
                        <div style={{ padding: '8px', minWidth: '200px' }}>
                            {toolGroupsArray.map((group, groupIndex) => (
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
                                        {group.tools.map((tool) => (
                                            <button
                                                key={tool.config.id}
                                                onClick={() => {
                                                    onToolChange(tool.config.id as any);
                                                    onClose();
                                                }}
                                                style={{
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    alignItems: 'center',
                                                    padding: '8px 4px',
                                                    border: drawingState.currentTool === tool.config.id ? '2px solid #0073aa' : '1px solid #ddd',
                                                    borderRadius: '4px',
                                                    backgroundColor: drawingState.currentTool === tool.config.id ? '#f0f8ff' : 'white',
                                                    cursor: 'pointer',
                                                    fontSize: '10px',
                                                    gap: '2px'
                                                }}
                                            >
                                                {tool.config.icon}
                                                <span>{tool.config.name}</span>
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
            <ToolbarGroup>
                <DropdownMenu
                    icon={settings}
                    label={__('Tool Settings', 'suggerence')}
                >
                    {() => {
                        const currentSettings = getCurrentSettings();
                        if (!currentTool) return <div>No tool selected</div>;

                        return (
                            <div style={{ padding: '16px', minWidth: '200px' }}>
                                {currentTool.config.settingsControls.map(control =>
                                    renderSettingControl(control, currentSettings)
                                )}
                            </div>
                        );
                    }}
                </DropdownMenu>
            </ToolbarGroup>


            {/* Undo/Redo */}
            <ToolbarGroup>
                <ToolbarButton
                    icon={undo}
                    label={__('Undo', 'suggerence')}
                    onClick={onUndo}
                    disabled={!canUndo}
                />
                <ToolbarButton
                    icon={redo}
                    label={__('Redo', 'suggerence')}
                    onClick={onRedo}
                    disabled={!canRedo}
                />
            </ToolbarGroup>

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