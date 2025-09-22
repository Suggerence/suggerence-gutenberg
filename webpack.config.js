const defaultConfig = require( '@wordpress/scripts/config/webpack.config' );

const path = require( 'path' );

module.exports = {
	...defaultConfig,
	entry: {
		components: path.resolve( __dirname, 'src/shared/style.css' ),
		'gutenberg-editor': path.resolve( __dirname, 'src/entry-points/gutenberg-editor.tsx' )
	},
	resolve: {
		...defaultConfig.resolve,
		alias: {
			...defaultConfig.resolve.alias,
			'@': path.resolve(__dirname, 'src')
		},
	}
};
