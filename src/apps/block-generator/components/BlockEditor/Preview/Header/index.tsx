import { __ } from "@wordpress/i18n";

import { Icon } from "@wordpress/components";
import { drawerRight, desktop } from "@wordpress/icons";

import { TabsList, TabsTrigger } from "@/components/ui/tabs";

interface BlockEditorPreviewHeaderProps
{
    activeTab: string;
}

export const BlockEditorPreviewHeader = ({ activeTab }: BlockEditorPreviewHeaderProps) =>
{
    return (
        <div className="w-full flex items-center justify-between border-block-generation-border border-b p-4 bg-block-generation-input/50">
            <h3 className="text-sm font-medium m-0! text-block-generation-primary! truncate">
                {activeTab === 'preview' ? __('Editor', 'suggerence-blocks') : __('Frontend', 'suggerence-blocks')}
            </h3>

            <TabsList>
                <TabsTrigger value="preview">
                    <Icon icon={drawerRight} fill="currentColor" />
                    <span className="text-block-generation-primary">{__('Editor', 'suggerence-blocks')}</span>
                </TabsTrigger>
                <TabsTrigger value="frontend">
                    <Icon icon={desktop} fill="currentColor" />
                    <span className="text-block-generation-primary">{__('Frontend', 'suggerence-blocks')}</span>
                </TabsTrigger>
            </TabsList>
        </div>
    );
}