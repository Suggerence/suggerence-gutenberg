
import { registerPlugin } from '@wordpress/plugins';
import { GutenbergAssistant } from '@/apps/gutenberg-assistant';
import { SuggerenceIcon } from '@/components/SuggerenceIcon';

registerPlugin('suggerence-gutenberg-assistant', {
    render: GutenbergAssistant,
    icon: <SuggerenceIcon />,
});