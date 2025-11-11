import { BlockToolbarIntegration } from '@/apps/gutenberg-toolbar/components/BlockToolbarIntegration';
import { CommandBox } from '@/apps/gutenberg-toolbar/components/CommandBox';

import './style.scss';

export const GutenbergToolbar = () => {
	return (
		<>
			<BlockToolbarIntegration />
			<CommandBox />
		</>
	);
};
