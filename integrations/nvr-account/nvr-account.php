<?php
/**
 * Plugin Name: Vertalis Account
 * Description: Backs the "Sign In / Create Account" tab on the Vertalis
 *              storefront's compliance gate (see components/VertalisGate.tsx)
 *              and the customer-facing /account order-history page. Thin
 *              wrapper over WordPress's own user system + WooCommerce
 *              customers — no custom DB table, unlike the separate
 *              vp-affiliates plugin (affiliates are a different, unrelated
 *              population from shop customers). A WP user created here has
 *              role "customer", so it's a normal WooCommerce customer and
 *              its orders are queryable the standard WC REST way
 *              (/wp-json/wc/v3/orders?customer=<user_id>).
 *
 * Implements the contract documented in COMPLIANCE.md → "Account wall
 * backend", plus one addition (`/me`) needed so the Next.js side can look up
 * "whose orders are these" from a bearer token WITHOUT trusting a
 * client-supplied email/user_id — the token is the only thing the browser
 * can't fake, so anything scoped to "my own data" must be resolved from it
 * server-side, not from a query param the browser sends.
 *
 *   POST /wp-json/nvr/v1/register  { email, password, username?, marketingOptIn? }
 *          -> 200 { token, email, username, user_id }   (409 if email exists)
 *   POST /wp-json/nvr/v1/login     { email, password }
 *          -> 200 { token, email, username, user_id }   (401 on bad creds)
 *   POST /wp-json/nvr/v1/validate  { token }
 *          -> 200 { valid: true | false }
 *   POST /wp-json/nvr/v1/me        { token }
 *          -> 200 { email, username, user_id }          (401 if invalid/expired)
 *
 * Version:     1.0.0
 * Author:      Vertalis Peptides
 * Requires WP: 6.0
 * Requires PHP: 8.0
 */

defined( 'ABSPATH' ) || exit;

define( 'NVR_ACCT_VERSION', '1.0.0' );

// ─────────────────────────────────────────────────────────────────────────────
// Token — stateless HMAC bearer token, same approach as vp-affiliates.php's
// vp_aff_make_token()/vp_aff_verify_token() (no session table needed).
// ─────────────────────────────────────────────────────────────────────────────

function nvr_acct_token_secret_option(): string {
    return 'nvr_acct_token_secret';
}

function nvr_acct_get_token_secret(): string {
    $secret = get_option( nvr_acct_token_secret_option() );
    if ( ! $secret ) {
        $secret = wp_generate_password( 64, true, true );
        update_option( nvr_acct_token_secret_option(), $secret );
    }
    return $secret;
}

/** 30-day bearer token, payload = "{user_id}.{expires}". */
function nvr_acct_make_token( int $user_id ): string {
    $secret  = nvr_acct_get_token_secret();
    $expires = time() + 30 * DAY_IN_SECONDS;
    $payload = $user_id . '.' . $expires;
    $sig     = hash_hmac( 'sha256', $payload, $secret );
    return base64_encode( $payload . '.' . $sig );
}

/** Returns the WP user_id if the token is valid & unexpired, else null. */
function nvr_acct_verify_token( ?string $token ): ?int {
    if ( ! $token ) return null;
    $decoded = base64_decode( $token, true );
    if ( ! $decoded ) return null;
    $parts = explode( '.', $decoded );
    if ( count( $parts ) !== 3 ) return null;
    [ $id, $expires, $sig ] = $parts;
    if ( (int) $expires < time() ) return null;
    $expected = hash_hmac( 'sha256', "{$id}.{$expires}", nvr_acct_get_token_secret() );
    if ( ! hash_equals( $expected, $sig ) ) return null;
    return (int) $id;
}

// ─────────────────────────────────────────────────────────────────────────────
// REST routes
// ─────────────────────────────────────────────────────────────────────────────

add_action( 'rest_api_init', function () {
    register_rest_route( 'nvr/v1', '/register', [
        'methods'             => 'POST',
        'callback'            => 'nvr_acct_register',
        'permission_callback' => '__return_true',
    ] );

    register_rest_route( 'nvr/v1', '/login', [
        'methods'             => 'POST',
        'callback'            => 'nvr_acct_login',
        'permission_callback' => '__return_true',
    ] );

    register_rest_route( 'nvr/v1', '/validate', [
        'methods'             => 'POST',
        'callback'            => 'nvr_acct_validate',
        'permission_callback' => '__return_true',
    ] );

    register_rest_route( 'nvr/v1', '/me', [
        'methods'             => 'POST',
        'callback'            => 'nvr_acct_me',
        'permission_callback' => '__return_true',
    ] );
} );

/**
 * POST /wp-json/nvr/v1/register
 * Creates a real WooCommerce customer (WP user, role "customer") — this is
 * the account whose orders later show up on the Next.js /account page and in
 * WooCommerce's own order admin, not a separate parallel record.
 */
function nvr_acct_register( WP_REST_Request $req ): WP_REST_Response {
    $body           = $req->get_json_params() ?: [];
    $email          = sanitize_email( $body['email'] ?? '' );
    $password       = (string) ( $body['password'] ?? '' );
    $username_in    = sanitize_user( $body['username'] ?? '', true );
    $marketing_opt  = ! empty( $body['marketingOptIn'] );

    if ( ! is_email( $email ) || strlen( $password ) < 8 ) {
        return new WP_REST_Response( [ 'error' => 'A valid email and a password of at least 8 characters are required.' ], 400 );
    }
    if ( email_exists( $email ) ) {
        return new WP_REST_Response( [ 'error' => 'existing_user_email' ], 409 );
    }

    // Derive a unique username from the email local-part if none was given
    // or it's already taken — WP usernames must be unique site-wide.
    $username = $username_in ?: sanitize_user( strstr( $email, '@', true ), true );
    if ( ! $username ) $username = 'customer';
    $base = $username;
    $i    = 1;
    while ( username_exists( $username ) ) {
        $username = $base . $i;
        $i++;
    }

    $user_id = wp_insert_user( [
        'user_login' => $username,
        'user_email' => $email,
        'user_pass'  => $password,
        'role'       => 'customer', // WooCommerce customer role, not a shop admin
    ] );

    if ( is_wp_error( $user_id ) ) {
        return new WP_REST_Response( [ 'error' => $user_id->get_error_message() ], 500 );
    }

    if ( $marketing_opt ) {
        update_user_meta( $user_id, 'nvr_marketing_opt_in', 1 );
    }

    return new WP_REST_Response( [
        'token'    => nvr_acct_make_token( (int) $user_id ),
        'email'    => $email,
        'username' => $username,
        'user_id'  => (int) $user_id,
    ], 200 );
}

/**
 * POST /wp-json/nvr/v1/login
 * Validates against WordPress's own user table (wp_check_password), same as
 * the front-end wp-login.php flow — this is deliberately a real WP account,
 * not a lightweight lookalike, so orders/addresses saved via WooCommerce
 * checkout under this email line up automatically.
 */
function nvr_acct_login( WP_REST_Request $req ): WP_REST_Response {
    $body     = $req->get_json_params() ?: [];
    $email    = sanitize_email( $body['email'] ?? '' );
    $password = (string) ( $body['password'] ?? '' );

    if ( ! is_email( $email ) || $password === '' ) {
        return new WP_REST_Response( [ 'error' => 'Email and password are required.' ], 400 );
    }

    $user = get_user_by( 'email', $email );
    if ( ! $user || ! wp_check_password( $password, $user->user_pass, $user->ID ) ) {
        return new WP_REST_Response( [ 'error' => 'Invalid email or password.' ], 401 );
    }

    return new WP_REST_Response( [
        'token'    => nvr_acct_make_token( (int) $user->ID ),
        'email'    => $user->user_email,
        'username' => $user->user_login,
        'user_id'  => (int) $user->ID,
    ], 200 );
}

/**
 * POST /wp-json/nvr/v1/validate
 * Boolean-only on purpose (see class docblock) — the gate just needs to know
 * whether to treat the visitor as signed in, not who they are.
 */
function nvr_acct_validate( WP_REST_Request $req ): WP_REST_Response {
    $body  = $req->get_json_params() ?: [];
    $token = (string) ( $body['token'] ?? '' );
    return new WP_REST_Response( [ 'valid' => nvr_acct_verify_token( $token ) !== null ], 200 );
}

/**
 * POST /wp-json/nvr/v1/me
 * Resolves a token to the account it belongs to, server-side. The Next.js
 * /api/account/orders route calls this FIRST and only ever queries
 * WooCommerce for the user_id this returns — the browser never gets to say
 * "give me customer X's orders" directly.
 */
function nvr_acct_me( WP_REST_Request $req ): WP_REST_Response {
    $body    = $req->get_json_params() ?: [];
    $token   = (string) ( $body['token'] ?? '' );
    $user_id = nvr_acct_verify_token( $token );

    if ( ! $user_id ) {
        return new WP_REST_Response( [ 'error' => 'Invalid or expired session.' ], 401 );
    }

    $user = get_user_by( 'id', $user_id );
    if ( ! $user ) {
        return new WP_REST_Response( [ 'error' => 'Invalid or expired session.' ], 401 );
    }

    return new WP_REST_Response( [
        'email'    => $user->user_email,
        'username' => $user->user_login,
        'user_id'  => (int) $user->ID,
    ], 200 );
}
