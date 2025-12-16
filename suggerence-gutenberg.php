<?php

/**
 * @wordpress-plugin
 * Plugin Name:       Suggerence - Gutenberg
 * Plugin URI:        https://sirvelia.com/
 * Description:       An AI Assistant for the Gutenberg editor.
 * Version:           0.3.4
 * Author:            Sirvelia
 * Author URI:        https://sirvelia.com/
 * License:           GPL-3.0+
 * License URI:       http://www.gnu.org/licenses/gpl-3.0.txt
 * Text Domain:       suggerence-gutenberg
 * Domain Path:       /languages
 * Update URI:        false
 * Requires Plugins:
 */

if (!defined('WPINC')) {
    die('YOU SHALL NOT PASS!');
}

// PLUGIN CONSTANTS
define('SUGGERENCEGUTENBERG_NAME', 'suggerence-gutenberg');
define('SUGGERENCEGUTENBERG_VERSION', '0.3.4');
define('SUGGERENCEGUTENBERG_PATH', plugin_dir_path(__FILE__));
define('SUGGERENCEGUTENBERG_BASENAME', plugin_basename(__FILE__));
define('SUGGERENCEGUTENBERG_URL', plugin_dir_url(__FILE__));
define('SUGGERENCEGUTENBERG_ASSETS_PATH', SUGGERENCEGUTENBERG_PATH . 'dist/' );
define('SUGGERENCEGUTENBERG_ASSETS_URL', SUGGERENCEGUTENBERG_URL . 'dist/' );
define('SUGGERENCEGUTENBERG_SCHEMAS_PATH', plugin_dir_path(__FILE__) . 'Schemas/');
define('SUGGERENCEGUTENBERG_UPDATER_URL', 'https://api.suggerence.com/');

// AUTOLOAD
if (file_exists(SUGGERENCEGUTENBERG_PATH . 'vendor/autoload.php')) {
    require_once SUGGERENCEGUTENBERG_PATH . 'vendor/autoload.php';
}

// LYFECYCLE
register_activation_hook(__FILE__, [SuggerenceGutenberg\Includes\Lyfecycle::class, 'activate']);
register_deactivation_hook(__FILE__, [SuggerenceGutenberg\Includes\Lyfecycle::class, 'deactivate']);
register_uninstall_hook(__FILE__, [SuggerenceGutenberg\Includes\Lyfecycle::class, 'uninstall']);

// LOAD ALL FILES
$loader = new SuggerenceGutenberg\Includes\Loader();
