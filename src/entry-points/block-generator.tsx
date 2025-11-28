import { registerPlugin } from '@wordpress/plugins';

import { BlockGenerator } from '@/apps/block-generator';

registerPlugin( 'suggerence-blocks-block-generator', {
    render: BlockGenerator,
} )