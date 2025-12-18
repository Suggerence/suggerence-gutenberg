const defaultConfig = require( '@wordpress/scripts/config/webpack.config' );

const path = require( 'path' );

module.exports = {
	...defaultConfig,
	entry: {
		components: path.resolve( __dirname, 'src/shared/style.css' ),
		'gutenberg-editor': path.resolve( __dirname, 'src/entry-points/gutenberg-editor.tsx' ),
		'block-generator': path.resolve( __dirname, 'src/entry-points/block-generator.tsx' ),
		'api-key-settings': path.resolve( __dirname, 'src/entry-points/api-key-settings.tsx' ),
		'theme-editor': path.resolve( __dirname, 'src/entry-points/theme-editor.tsx' )
	},
	resolve: {
		...defaultConfig.resolve,
		alias: {
			...defaultConfig.resolve.alias,
			'@': path.resolve(__dirname, 'src')
		},
	}
};
