<?php
/**
 * Plugin Name: UMBRCOM — Store API CORS fix
 * Description: Allows the headless storefront at umbrcom.co.il to call the
 *              WooCommerce Store API on this WordPress install. Diagnosed
 *              July 2026: the OPTIONS preflight got Access-Control-Allow-Origin
 *              (server-level rule) but the actual /wc/store/* responses did
 *              not, so every product fetch from the storefront failed CORS.
 *              The /umbrcom/v1/* routes already sent the header — this brings
 *              the rest of /wp-json in line.
 *
 * Install: drop into wp-content/mu-plugins/ (create the folder if missing) —
 * mu-plugins load always, can't be deactivated by accident. Or merge the two
 * hooks into umbrcom-content-engine.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

const UMBRCOM_ALLOWED_ORIGINS = array(
	'https://umbrcom.co.il',
	'https://www.umbrcom.co.il',
	'http://localhost:5173', // Vite dev server — remove if you don't want it
);

/** Let WP core treat the storefront as an allowed origin. */
add_filter( 'allowed_http_origins', function ( array $origins ): array {
	return array_values( array_unique( array_merge( $origins, UMBRCOM_ALLOWED_ORIGINS ) ) );
} );

/**
 * Guarantee the header on every REST response (WP core / plugins sometimes
 * skip or strip it on actual responses even when the preflight passes).
 */
add_filter( 'rest_pre_serve_request', function ( $served ) {
	$origin = get_http_origin();
	if ( $origin && in_array( $origin, UMBRCOM_ALLOWED_ORIGINS, true ) ) {
		header( 'Access-Control-Allow-Origin: ' . esc_url_raw( $origin ) );
		header( 'Access-Control-Allow-Credentials: true' );
		header( 'Vary: Origin', false );
	}
	return $served;
}, 20 );
