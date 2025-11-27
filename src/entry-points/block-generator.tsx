import { registerPlugin } from '@wordpress/plugins';

import { BlockGenerator } from '@/apps/block-generator';

console.log("hola ");

registerPlugin( 'suggerence-blocks-block-generator', {
    render: BlockGenerator,
} )