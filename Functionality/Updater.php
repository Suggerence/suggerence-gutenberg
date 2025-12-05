<?php

namespace SuggerenceGutenberg\Functionality;

class Updater
{
    public $updater_url;

    /**
	 * @var string
	 */
	public $cache_key;

	/**
	 * @var boolean
	 */
	public $cache_allowed;

    /**
	 * @var string
	 */
	public $plugin_name;

    /**
	 * @var string
	 */
	public $plugin_slug;

    /**
	 * @var string
	 */
	public $plugin_version;

    public function __construct($plugin_name, $plugin_version)
    {
        $this->plugin_name = $plugin_name;
        $this->plugin_version = $plugin_version;
        $this->plugin_slug = 'suggerence-gutenberg';
        $this->updater_url = $this->resolve_updater_url();

        $this->cache_key     = str_replace( '-', '_', $this->plugin_slug ) . '_updater';
		$this->cache_allowed = true; // Only disable this for debugging

		add_filter( 'plugins_api', array( $this, 'info' ), 20, 3 );
		add_filter( 'site_transient_update_plugins', array( $this, 'update' ) );
		add_action( 'upgrader_process_complete', array( $this, 'purge' ), 10, 2 );
    }

    private function resolve_updater_url(): string
    {
        $default = defined('SUGGERENCEGUTENBERG_UPDATER_URL')
            ? SUGGERENCEGUTENBERG_UPDATER_URL
            : 'https://api.suggerence.com/';

        return (string) apply_filters('suggerence_gutenberg_updater_url', $default);
    }

	/**
	 * Fetch the update info from the remote server.
	 *
	 * @return object|bool
	 */
	public function request() {
		$remote = get_transient( $this->cache_key );
		if ( false !== $remote && $this->cache_allowed ) {
			if ( 'error' === $remote ) {
				return false;
			}

			return json_decode( $remote );
		}

		$remote = wp_remote_post( $this->updater_url . "v1/plugin/check", [
			'sslverify' => false,
			'timeout' => 30,
			'headers'     => array('Content-Type' => 'application/json; charset=utf-8'),
			'body'        => json_encode(
				[
                    'id' => $this->plugin_name,
					'domain' => home_url()
				]
			),
			'data_format' => 'body',
		] );

		if (
			is_wp_error( $remote )
			|| 200 !== wp_remote_retrieve_response_code( $remote )
			|| empty( wp_remote_retrieve_body( $remote ) )
		) {
			set_transient( $this->cache_key, 'error', MINUTE_IN_SECONDS * 10 );
			return false;
		}

		$payload = wp_remote_retrieve_body( $remote );
		set_transient( $this->cache_key, $payload, MINUTE_IN_SECONDS * 30 );

		return json_decode( $payload );
	}

	/**
	 * Override the WordPress request to return the correct plugin info.
	 *
	 * @see https://developer.wordpress.org/reference/hooks/plugins_api/
	 *
	 * @param false|object|array $result
	 * @param string $action
	 * @param object $args
	 * @return object|bool
	 */
	public function info( $result, $action, $args ) {
		if ( 'plugin_information' !== $action ) {
			return false;
		}
		if ( $this->plugin_slug !== $args->slug ) {
			return false;
		}

		$remote = $this->request();
		//die( print_r($remote, true) );
		if ( !$remote || !isset($remote->plugin) || empty( $remote->plugin ) ) {
			return false;
		}

		//error_log( print_r($result, true) );

		$plugin_data = $remote->plugin;
		$plugin_data->tested = null;
		$plugin_data->sections = (array) json_decode( $remote->plugin->sections );
		$plugin_data->download_url = $remote->download_url ?? '';

		return (object) $plugin_data;
	}

	/**
	 * Override the WordPress request to check if an update is available.
	 *
	 * @see https://make.wordpress.org/core/2020/07/30/recommended-usage-of-the-updates-api-to-support-the-auto-updates-ui-for-plugins-and-themes-in-wordpress-5-5/
	 *
	 * @param object $transient
	 * @return object
	 */
	public function update( $transient ) {
		if ( empty( $transient->checked ) ) {
			return $transient;
		}

		$res = (object) array(
			'id'            => SUGGERENCEGUTENBERG_BASENAME,
			'slug'          => $this->plugin_slug,
			'plugin'        => SUGGERENCEGUTENBERG_BASENAME,
			'new_version'   => $this->plugin_version,
			'url'           => '',
			'package'       => '',
			'icons'         => array(),
			'banners'       => array(),
			'banners_rtl'   => array(),
			'tested'        => '',
			'requires_php'  => '',
			'compatibility' => new \stdClass(),
		);

		$remote = $this->request();

		if (
			$remote && $remote->plugin && ! empty( $remote->plugin )
			&& version_compare( $this->plugin_version, $remote->plugin->version, '<' )
		) {
			$res->new_version = $remote->plugin->version;
			$res->package     = $remote->download_url ?? '';

			$transient->response[ $res->plugin ] = $res;
		} else {
			$transient->no_update[ $res->plugin ] = $res;
		}

		return $transient;
	}

	/**
	 * When the update is complete, purge the cache.
	 *
	 * @see https://developer.wordpress.org/reference/hooks/upgrader_process_complete/
	 *
	 * @param WP_Upgrader $upgrader
	 * @param array $options
	 * @return void
	 */
	public function purge( $upgrader, $options ) {
		if (
			$this->cache_allowed
			&& 'update' === $options['action']
			&& 'plugin' === $options['type']
			&& ! empty( $options['plugins'] )
		) {
			foreach ( $options['plugins'] as $plugin ) {
				if ( $plugin === SUGGERENCEGUTENBERG_BASENAME ) {
					delete_transient( $this->cache_key );
				}
			}
		}
	}
}
