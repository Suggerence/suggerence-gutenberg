import { __ } from '@wordpress/i18n';
import { Button } from '@/components/ui/button';
import type { ToolDefinition } from '../../types/tool';

interface ToolSelectorProps {
    tools: ToolDefinition[];
    onSelectTool: (toolName: string) => void;
}

export const ToolSelector = ({ tools, onSelectTool }: ToolSelectorProps) => {
    return (
        <div className="space-y-2">
            <h3 className="text-sm font-medium text-primary! mb-3">
                {__("Select a tool to execute", "suggerence")}
            </h3>
            <div className="flex flex-wrap gap-2">
                {tools.map((tool) => (
                    <Button
                        key={tool.name}
                        variant="block-generation-primary"
                        size="sm"
                        className="flex-1 min-w-[120px] max-w-fit"
                        onClick={() => onSelectTool(tool.name)}
                    >
                        {tool.name}
                    </Button>
                ))}
            </div>
        </div>
    );
};
