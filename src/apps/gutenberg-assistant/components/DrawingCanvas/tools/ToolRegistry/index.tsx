import { DrawingToolBase } from '@/apps/gutenberg-assistant/components/DrawingCanvas/tools/base';
import { BrushTool } from '@/apps/gutenberg-assistant/components/DrawingCanvas/tools/BrushTool';
import { MarkerTool } from '@/apps/gutenberg-assistant/components/DrawingCanvas/tools/MarkerTool';
import { EraserTool } from '@/apps/gutenberg-assistant/components/DrawingCanvas/tools/EraserTool';
import { LineTool } from '@/apps/gutenberg-assistant/components/DrawingCanvas/tools/LineTool';
import { RectangleTool } from '@/apps/gutenberg-assistant/components/DrawingCanvas/tools/RectangleTool';
import { CircleTool } from '@/apps/gutenberg-assistant/components/DrawingCanvas/tools/CircleTool';
import { ArrowTool } from '@/apps/gutenberg-assistant/components/DrawingCanvas/tools/ArrowTool';
import { TextTool } from '@/apps/gutenberg-assistant/components/DrawingCanvas/tools/TextTool';
import { MoveTool } from '@/apps/gutenberg-assistant/components/DrawingCanvas/tools/MoveTool';

class ToolRegistry {
    private tools = new Map<string, DrawingToolBase>();
    private toolGroups = new Map<string, DrawingToolBase[]>();

    constructor() {
        this.registerDefaultTools();
    }

    private registerDefaultTools(): void {
        // Register all default tools
        this.registerTool(new BrushTool());
        this.registerTool(new MarkerTool());
        this.registerTool(new EraserTool());
        this.registerTool(new LineTool());
        this.registerTool(new RectangleTool());
        this.registerTool(new CircleTool());
        this.registerTool(new ArrowTool());
        this.registerTool(new TextTool());
        this.registerTool(new MoveTool());
    }

    registerTool(tool: DrawingToolBase): void {
        this.tools.set(tool.config.id, tool);

        // Add to group
        const group = tool.config.group;
        if (!this.toolGroups.has(group)) {
            this.toolGroups.set(group, []);
        }
        this.toolGroups.get(group)!.push(tool);
    }

    getTool(id: string): DrawingToolBase | undefined {
        return this.tools.get(id);
    }

    getAllTools(): DrawingToolBase[] {
        return Array.from(this.tools.values());
    }

    getToolGroups(): Map<string, DrawingToolBase[]> {
        return new Map(this.toolGroups);
    }

    getToolsByGroup(group: string): DrawingToolBase[] {
        return this.toolGroups.get(group) || [];
    }

    unregisterTool(id: string): boolean {
        const tool = this.tools.get(id);
        if (!tool) return false;

        // Remove from tools map
        this.tools.delete(id);

        // Remove from group
        const group = this.toolGroups.get(tool.config.group);
        if (group) {
            const index = group.findIndex(t => t.config.id === id);
            if (index !== -1) {
                group.splice(index, 1);
            }

            // If group is empty, remove it
            if (group.length === 0) {
                this.toolGroups.delete(tool.config.group);
            }
        }

        return true;
    }

    getDefaultSettings(): Record<string, any> {
        const settings: Record<string, any> = {};

        for (const tool of this.tools.values()) {
            settings[`${tool.config.id}Settings`] = { ...tool.config.defaultSettings };
        }

        return settings;
    }
}

// Export singleton instance
export const toolRegistry = new ToolRegistry();
export { ToolRegistry };