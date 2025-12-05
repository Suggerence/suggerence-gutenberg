import { BlockToolbarIntegration } from '@/apps/gutenberg-toolbar/components/BlockToolbarIntegration';
import { CommandBox } from '@/apps/gutenberg-toolbar/components/CommandBox';
import { SuggerenceSurface } from '@/shared/components/SuggerenceSurface';

import './style.scss';

export const GutenbergToolbar = () => {
	return (
		<SuggerenceSurface>
			<BlockToolbarIntegration />
			<CommandBox />
		</SuggerenceSurface>
	);
};
