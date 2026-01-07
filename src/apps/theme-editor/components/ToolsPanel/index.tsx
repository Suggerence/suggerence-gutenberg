import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Wrench, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { tools } from '../../tools';
import { ToolSelector } from './ToolSelector';
import { ToolExecutor } from './ToolExecutor';
import { TOOLS_PANEL_ENABLED } from '../../constants';

export const ToolsPanel = () => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [selectedTool, setSelectedTool] = useState<string | null>(null);

    if (!TOOLS_PANEL_ENABLED) {
        return null;
    }

    const tool = selectedTool ? tools.find(t => t.name === selectedTool) : null;

    return (
        <div className="fixed top-0 left-0 right-0 z-999997 pointer-events-none">
            <div className="pointer-events-auto bg-card/95 backdrop-blur-xl border-b border-border/50 shadow-lg">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-2 border-b border-border/30">
                    <div className="flex items-center gap-2">
                        <Wrench className="size-4 text-primary" />
                        <h2 className="text-sm font-semibold text-primary! m-0">
                            {__("Theme Editor Tools", "suggerence")}
                        </h2>
                        <span className="text-xs text-muted-foreground">
                            ({tools.length} {tools.length === 1 ? 'tool' : 'tools'})
                        </span>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="h-7 w-7 text-muted-foreground hover:text-primary!"
                        aria-label={isExpanded ? __("Collapse", "suggerence") : __("Expand", "suggerence")}
                    >
                        {isExpanded ? (
                            <ChevronUp className="size-4" />
                        ) : (
                            <ChevronDown className="size-4" />
                        )}
                    </Button>
                </div>

                {/* Content */}
                {isExpanded && (
                    <div className="p-4 max-h-[600px] overflow-y-auto sugg-scrollbar">
                        {!selectedTool ? (
                            <ToolSelector
                                tools={tools}
                                onSelectTool={(toolName) => setSelectedTool(toolName)}
                            />
                        ) : (
                            <ToolExecutor
                                tool={tool!}
                                onBack={() => setSelectedTool(null)}
                            />
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
