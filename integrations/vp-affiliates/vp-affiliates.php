<?php
/**
 * Plugin Name: Vertalis Affiliates
 * Description: Affiliate program engine — admin-created affiliate accounts, unique
 *              referral links, 30-day cookie attribution, and commission tracking
 *              verified against real WooCommerce sales (confirmed on order
 *              completion). Ported from the VP Affiliates plugin (Vintage Peptides /
 *              My Secret Vitality / Liberty Peptides), scoped to this install's own
 *              storefront(s). Vertalis runs its own separate WooCommerce backend, so
 *              this is an independent installation, not a 4th brand on that shared
 *              one. Add more entries to VPAFF_STOREFRONTS below if Vertalis ever
 *              spins up sibling storefronts on this same WordPress install.
 * Version:     1.6.0
 * Author:      Vertalis Peptides
 * Requires WP: 6.0
 * Requires PHP: 8.0
 */

defined( 'ABSPATH' ) || exit;

define( 'VPAFF_VERSION', '1.6.0' );
define( 'VPAFF_DB_VERSION', '1.4.0' ); // no schema change in 1.5.0 — reset tokens are stateless, no new table/column

// ─────────────────────────────────────────────────────────────────────────────
// Database
// ─────────────────────────────────────────────────────────────────────────────

function vp_aff_create_tables(): void {
    global $wpdb;
    $charset = $wpdb->get_charset_collate();

    $affiliates = $wpdb->prefix . 'vp_affiliates';
    $clicks     = $wpdb->prefix . 'vp_affiliate_clicks';
    $commissions = $wpdb->prefix . 'vp_affiliate_commissions';

    $payouts   = $wpdb->prefix . 'vp_affiliate_payouts';
    $materials = $wpdb->prefix . 'vp_affiliate_materials';

    $sql = "CREATE TABLE {$affiliates} (
        id                 BIGINT(20) UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        name               VARCHAR(200) NOT NULL,
        email              VARCHAR(200) NOT NULL,
        password_hash      VARCHAR(255) NOT NULL DEFAULT '',
        ref_code           VARCHAR(60)  NOT NULL,
        storefront         VARCHAR(50)  NOT NULL DEFAULT 'vertalis',
        commission_pct     DECIMAL(5,2) NULL DEFAULT NULL,
        status             VARCHAR(20)  NOT NULL DEFAULT 'active',
        notes              TEXT NULL,
        coupon_code        VARCHAR(60)  NOT NULL DEFAULT '',
        payout_method      VARCHAR(20)  NOT NULL DEFAULT '',
        payout_destination VARCHAR(200) NOT NULL DEFAULT '',
        created_at         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY email_storefront (email, storefront),
        UNIQUE KEY ref_code (ref_code),
        KEY storefront (storefront),
        KEY status (status)
    ) {$charset};

    CREATE TABLE {$clicks} (
        id            BIGINT(20) UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        affiliate_id  BIGINT(20) UNSIGNED NOT NULL,
        storefront    VARCHAR(50) NOT NULL DEFAULT 'vertalis',
        ip_hash       VARCHAR(64) NOT NULL DEFAULT '',
        landing_url   VARCHAR(500) NOT NULL DEFAULT '',
        created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        KEY affiliate_id (affiliate_id),
        KEY created_at (created_at)
    ) {$charset};

    CREATE TABLE {$commissions} (
        id                 BIGINT(20) UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        affiliate_id       BIGINT(20) UNSIGNED NOT NULL,
        order_id           BIGINT(20) UNSIGNED NOT NULL,
        storefront         VARCHAR(50) NOT NULL DEFAULT 'vertalis',
        order_total        DECIMAL(10,2) NOT NULL DEFAULT 0,
        commission_pct     DECIMAL(5,2) NOT NULL DEFAULT 0,
        commission_amount  DECIMAL(10,2) NOT NULL DEFAULT 0,
        status             VARCHAR(20) NOT NULL DEFAULT 'pending',
        attribution        VARCHAR(20) NOT NULL DEFAULT 'link',
        payout_id          BIGINT(20) UNSIGNED NULL DEFAULT NULL,
        created_at         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        confirmed_at       DATETIME NULL,
        paid_at            DATETIME NULL,
        UNIQUE KEY order_id (order_id),
        KEY affiliate_id (affiliate_id),
        KEY status (status),
        KEY payout_id (payout_id)
    ) {$charset};

    CREATE TABLE {$payouts} (
        id              BIGINT(20) UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        affiliate_id    BIGINT(20) UNSIGNED NOT NULL,
        storefront      VARCHAR(50) NOT NULL DEFAULT 'vertalis',
        amount          DECIMAL(10,2) NOT NULL DEFAULT 0,
        method          VARCHAR(20)  NOT NULL DEFAULT '',
        destination     VARCHAR(200) NOT NULL DEFAULT '',
        status          VARCHAR(20)  NOT NULL DEFAULT 'requested',
        requested_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        paid_at         DATETIME NULL,
        KEY affiliate_id (affiliate_id),
        KEY status (status)
    ) {$charset};

    CREATE TABLE {$materials} (
        id            BIGINT(20) UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        storefront    VARCHAR(50) NOT NULL DEFAULT 'vertalis',
        type          VARCHAR(20) NOT NULL DEFAULT 'image',
        title         VARCHAR(200) NOT NULL DEFAULT '',
        content       TEXT NOT NULL,
        affiliate_id  BIGINT(20) UNSIGNED NULL DEFAULT NULL,
        status        VARCHAR(20) NOT NULL DEFAULT 'approved',
        created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        KEY storefront (storefront),
        KEY affiliate_id (affiliate_id),
        KEY status (status)
    ) {$charset};";

    require_once ABSPATH . 'wp-admin/includes/upgrade.php';
    dbDelta( $sql );
}

/**
 * 1.4.0 migration: one affiliate account used to be globally unique by
 * email (one brand only, ever). Multi-brand affiliates need the same
 * person's email to exist once per storefront instead — see the
 * email_storefront key in vp_aff_create_tables(). dbDelta() only ADDS
 * indexes it doesn't recognize; it won't drop the old single-column
 * `email` unique key on its own, so that has to happen explicitly here
 * before dbDelta runs, or the old key keeps blocking a second brand.
 * Safe to call repeatedly — checks for the old key before touching it.
 */
function vp_aff_migrate_email_uniqueness(): void {
    global $wpdb;
    $table = $wpdb->prefix . 'vp_affiliates';
    if ( $wpdb->get_var( "SHOW TABLES LIKE '{$table}'" ) !== $table ) return; // fresh install, nothing to migrate
    $has_old_key = $wpdb->get_var( $wpdb->prepare(
        "SELECT COUNT(*) FROM information_schema.STATISTICS WHERE table_schema = DATABASE() AND table_name = %s AND index_name = 'email'",
        $table
    ) );
    if ( $has_old_key ) {
        $wpdb->query( "ALTER TABLE {$table} DROP INDEX email" );
    }
}

register_activation_hook( __FILE__, function () {
    vp_aff_migrate_email_uniqueness();
    vp_aff_create_tables();
    vp_aff_get_token_secret(); // generate on activation
} );

add_action( 'plugins_loaded', function () {
    if ( get_option( 'vp_aff_db_version' ) !== VPAFF_DB_VERSION ) {
        vp_aff_migrate_email_uniqueness();
        vp_aff_create_tables();
        update_option( 'vp_aff_db_version', VPAFF_DB_VERSION );
    }
} );

// ─────────────────────────────────────────────────────────────────────────────
// Helpers — storefront, settings, tokens
// ─────────────────────────────────────────────────────────────────────────────

/**
 * This install's storefront(s). Vertalis runs solo for now — add a line here
 * (and nowhere else; every admin page and API route reads this constant) the
 * day Vertalis launches a sibling brand on this same WordPress install.
 */
const VPAFF_STOREFRONTS = [
    'vertalis' => 'Vertalis Peptides',
    // 'sibling-slug' => 'Sibling Brand Name',
];

function vp_aff_sanitize_storefront( ?string $sf ): string {
    $default = array_key_first( VPAFF_STOREFRONTS );
    return array_key_exists( (string) $sf, VPAFF_STOREFRONTS ) ? $sf : $default;
}

/** Shared display labels for this install's storefront(s) — used by both the
 *  per-brand admin page and the cross-brand All Affiliates page. */
function vp_aff_storefront_labels(): array {
    return VPAFF_STOREFRONTS;
}

/**
 * Settings stored in wp_options as vp_aff_settings_{storefront}.
 * default_pct              – commission % applied when an affiliate has no override.
 * discount_pct             – % off given to a shopper who uses an affiliate's personal
 *                            coupon code (their ref_code). Affiliate still earns
 *                            commission on the discounted total.
 * cookie_days              – informational only (frontend enforces the actual cookie
 *                            lifetime); shown in admin so the two stay in sync.
 * min_payout               – smallest confirmed balance an affiliate can request a
 *                            withdrawal for.
 * payout_methods           – which of the catalog in vp_aff_payout_methods() this
 *                            storefront accepts (e.g. one site may not want crypto).
 * allow_affiliate_materials – whether affiliates on this storefront can submit their
 *                            own marketing materials (subject to admin approval),
 *                            in addition to what admins add directly.
 */
function vp_aff_get_settings( string $storefront ): array {
    $defaults = [
        'default_pct'              => 10.0,
        'discount_pct'             => 10.0,
        'cookie_days'              => 30,
        'min_payout'               => 25.0,
        'payout_methods'           => array_keys( vp_aff_payout_methods() ),
        'allow_affiliate_materials' => false,
    ];
    $stored = get_option( "vp_aff_settings_{$storefront}", [] );
    return array_merge( $defaults, is_array( $stored ) ? $stored : [] );
}

/** Full catalog of payout methods the plugin knows how to display/label.
 *  Which of these are actually offered to affiliates is controlled per
 *  storefront via Settings → see vp_aff_enabled_payout_methods(). */
function vp_aff_payout_methods(): array {
    return [
        'zelle'   => 'Zelle',
        'cashapp' => 'Cash App',
        'venmo'   => 'Venmo',
        'btc'     => 'Bitcoin',
        'usdt'    => 'USDT',
        'usdc'    => 'USDC',
    ];
}

/** The subset of vp_aff_payout_methods() this storefront actually accepts,
 *  as chosen by an admin in Settings. Falls back to the full catalog if
 *  nothing has been configured yet (keeps old behavior for existing sites). */
function vp_aff_enabled_payout_methods( string $storefront ): array {
    $settings = vp_aff_get_settings( $storefront );
    $enabled  = is_array( $settings['payout_methods'] ?? null ) ? $settings['payout_methods'] : [];
    $catalog  = vp_aff_payout_methods();
    $filtered = array_intersect_key( $catalog, array_flip( $enabled ) );
    return $filtered ?: $catalog;
}

function vp_aff_token_secret_option(): string {
    return 'vp_aff_token_secret';
}

function vp_aff_get_token_secret(): string {
    $secret = get_option( vp_aff_token_secret_option() );
    if ( ! $secret ) {
        $secret = wp_generate_password( 64, true, true );
        update_option( vp_aff_token_secret_option(), $secret );
    }
    return $secret;
}

/** Stateless HMAC bearer token — no session table needed. 30 day lifetime. */
function vp_aff_make_token( int $affiliate_id ): string {
    $secret  = vp_aff_get_token_secret();
    $expires = time() + 30 * DAY_IN_SECONDS;
    $payload = $affiliate_id . '.' . $expires;
    $sig     = hash_hmac( 'sha256', $payload, $secret );
    return base64_encode( $payload . '.' . $sig );
}

/** Returns the affiliate_id if valid & unexpired, else null. */
function vp_aff_verify_token( ?string $token ): ?int {
    if ( ! $token ) return null;
    $decoded = base64_decode( $token, true );
    if ( ! $decoded ) return null;
    $parts = explode( '.', $decoded );
    if ( count( $parts ) !== 3 ) return null;
    [ $id, $expires, $sig ] = $parts;
    if ( (int) $expires < time() ) return null;
    $expected = hash_hmac( 'sha256', "{$id}.{$expires}", vp_aff_get_token_secret() );
    if ( ! hash_equals( $expected, $sig ) ) return null;
    return (int) $id;
}

function vp_aff_get_bearer_token( WP_REST_Request $req ): ?string {
    $header = $req->get_header( 'authorization' );
    if ( $header && stripos( $header, 'Bearer ' ) === 0 ) {
        return trim( substr( $header, 7 ) );
    }
    return null;
}

/**
 * Password reset tokens — same stateless HMAC approach as the login/session
 * token (no extra DB table), but single-use: the signed payload embeds a
 * short fingerprint of the affiliate's CURRENT password_hash. Once the
 * password actually changes, that fingerprint no longer matches, so a reused
 * or intercepted-after-use link fails verification on its own — no need to
 * track "used" tokens anywhere. 1 hour lifetime, separate from the 30-day
 * session token (different payload prefix so the two can never be confused).
 */
function vp_aff_make_reset_token( int $affiliate_id, string $current_password_hash ): string {
    $secret      = vp_aff_get_token_secret();
    $expires     = time() + HOUR_IN_SECONDS;
    $fingerprint = substr( hash( 'sha256', $current_password_hash ), 0, 16 );
    $payload     = "reset.{$affiliate_id}.{$expires}.{$fingerprint}";
    $sig         = hash_hmac( 'sha256', $payload, $secret );
    return base64_encode( $payload . '.' . $sig );
}

/** Returns the affiliate_id if the reset token is valid, unexpired, and the
 *  password hasn't changed since it was issued — else null. */
function vp_aff_verify_reset_token( ?string $token ): ?int {
    if ( ! $token ) return null;
    $decoded = base64_decode( $token, true );
    if ( ! $decoded ) return null;
    $parts = explode( '.', $decoded );
    if ( count( $parts ) !== 5 || $parts[0] !== 'reset' ) return null;
    [ , $id, $expires, $fingerprint, $sig ] = $parts;
    if ( (int) $expires < time() ) return null;

    $payload  = "reset.{$id}.{$expires}.{$fingerprint}";
    $expected = hash_hmac( 'sha256', $payload, vp_aff_get_token_secret() );
    if ( ! hash_equals( $expected, $sig ) ) return null;

    $affiliate = vp_aff_get_affiliate( (int) $id );
    if ( ! $affiliate ) return null;

    $current_fingerprint = substr( hash( 'sha256', $affiliate->password_hash ), 0, 16 );
    if ( ! hash_equals( $current_fingerprint, $fingerprint ) ) return null; // already used, or password changed since

    return (int) $id;
}

/** Generates a short, unique, URL-safe referral code from the affiliate name. */
function vp_aff_generate_ref_code( string $name ): string {
    global $wpdb;
    $table = $wpdb->prefix . 'vp_affiliates';
    $base  = strtoupper( preg_replace( '/[^A-Za-z]/', '', $name ) );
    $base  = substr( $base ?: 'AFF', 0, 6 );
    do {
        $code = $base . strtoupper( substr( bin2hex( random_bytes( 3 ) ), 0, 4 ) );
        $exists = $wpdb->get_var( $wpdb->prepare(
            "SELECT id FROM {$table} WHERE ref_code = %s", $code
        ) );
    } while ( $exists );
    return $code;
}

function vp_aff_hash_ip( string $ip ): string {
    return hash( 'sha256', $ip . vp_aff_get_token_secret() );
}

function vp_aff_get_affiliate( int $id ) {
    global $wpdb;
    $table = $wpdb->prefix . 'vp_affiliates';
    return $wpdb->get_row( $wpdb->prepare( "SELECT * FROM {$table} WHERE id = %d", $id ) );
}

function vp_aff_get_affiliate_by_code( string $ref_code, ?string $storefront = null ) {
    global $wpdb;
    $table = $wpdb->prefix . 'vp_affiliates';
    if ( $storefront ) {
        return $wpdb->get_row( $wpdb->prepare(
            "SELECT * FROM {$table} WHERE ref_code = %s AND storefront = %s", $ref_code, $storefront
        ) );
    }
    return $wpdb->get_row( $wpdb->prepare( "SELECT * FROM {$table} WHERE ref_code = %s", $ref_code ) );
}

/** Effective commission % for an affiliate — their override, or the storefront default. */
function vp_aff_effective_pct( object $affiliate ): float {
    if ( $affiliate->commission_pct !== null && $affiliate->commission_pct !== '' ) {
        return (float) $affiliate->commission_pct;
    }
    $settings = vp_aff_get_settings( vp_aff_sanitize_storefront( $affiliate->storefront ) );
    return (float) $settings['default_pct'];
}

/**
 * Creates (or reuses) a real WooCommerce percentage-off coupon using the
 * affiliate's own ref_code, so they can share "use code JOHN4F2A for 10% off"
 * as an alternative to the referral link. Idempotent — safe to call every
 * time an affiliate is activated. Requires WooCommerce's WC_Coupon class.
 */
function vp_aff_ensure_coupon( int $affiliate_id ): void {
    if ( ! class_exists( 'WC_Coupon' ) ) return; // WooCommerce not loaded (e.g. during CLI/test contexts)

    global $wpdb;
    $affiliate = vp_aff_get_affiliate( $affiliate_id );
    if ( ! $affiliate || ! $affiliate->ref_code ) return;

    $code = strtolower( $affiliate->ref_code ); // WC stores/matches coupon codes lowercase
    $existing_id = function_exists( 'wc_get_coupon_id_by_code' ) ? wc_get_coupon_id_by_code( $code ) : 0;

    if ( ! $existing_id ) {
        $settings = vp_aff_get_settings( vp_aff_sanitize_storefront( $affiliate->storefront ) );
        try {
            $coupon = new WC_Coupon();
            $coupon->set_code( $code );
            $coupon->set_discount_type( 'percent' );
            $coupon->set_amount( (float) $settings['discount_pct'] );
            $coupon->set_individual_use( false );
            $coupon->set_usage_limit( 0 ); // 0 = unlimited in WC's schema
            $coupon->add_meta_data( 'vp_affiliate_id', $affiliate_id, true );
            $coupon->add_meta_data( 'vp_storefront', $affiliate->storefront, true );
            $coupon->save();
        } catch ( \Throwable $e ) {
            error_log( '[vp-affiliates] coupon creation failed for affiliate ' . $affiliate_id . ': ' . $e->getMessage() );
        }
    }

    if ( $affiliate->coupon_code !== $affiliate->ref_code ) {
        $wpdb->update( $wpdb->prefix . 'vp_affiliates', [ 'coupon_code' => $affiliate->ref_code ], [ 'id' => $affiliate_id ] );
    }
}

/** Looks up an affiliate by the coupon code used on an order (case-insensitive). */
function vp_aff_get_affiliate_by_coupon( string $code ): ?object {
    global $wpdb;
    $table = $wpdb->prefix . 'vp_affiliates';
    $row = $wpdb->get_row( $wpdb->prepare(
        "SELECT * FROM {$table} WHERE coupon_code = %s", strtoupper( $code )
    ) );
    return $row ?: null;
}

// ─────────────────────────────────────────────────────────────────────────────
// REST API
// ─────────────────────────────────────────────────────────────────────────────

add_action( 'rest_api_init', function () {

    // ── Public ──────────────────────────────────────────────────────────────

    // POST /wp-json/vp-affiliates/v1/track-click
    register_rest_route( 'vp-affiliates/v1', '/track-click', [
        'methods'             => 'POST',
        'callback'            => 'vp_aff_track_click',
        'permission_callback' => '__return_true',
        'args'                => [
            'ref_code'    => [ 'required' => true,  'sanitize_callback' => 'sanitize_text_field' ],
            'storefront'  => [ 'required' => false, 'sanitize_callback' => 'sanitize_text_field', 'default' => 'vertalis' ],
            'landing_url' => [ 'required' => false, 'sanitize_callback' => 'esc_url_raw', 'default' => '' ],
        ],
    ] );

    // POST /wp-json/vp-affiliates/v1/auth/login
    // NOTE: the credential field is named `secret` on the wire (not
    // `password`) on purpose — see the comment on vp_aff_login() below.
    register_rest_route( 'vp-affiliates/v1', '/auth/login', [
        'methods'             => 'POST',
        'callback'            => 'vp_aff_login',
        'permission_callback' => '__return_true',
        'args'                => [
            'email'      => [ 'required' => true, 'sanitize_callback' => 'sanitize_email' ],
            'secret'     => [ 'required' => true ],
            'storefront' => [ 'required' => false, 'sanitize_callback' => 'sanitize_text_field', 'default' => 'vertalis' ],
        ],
    ] );

    // POST /wp-json/vp-affiliates/v1/register — public self-signup (status: pending)
    register_rest_route( 'vp-affiliates/v1', '/register', [
        'methods'             => 'POST',
        'callback'            => 'vp_aff_register',
        'permission_callback' => '__return_true',
    ] );

    // POST /wp-json/vp-affiliates/v1/auth/forgot-password — request a reset email.
    // Always responds with a generic success message (doesn't reveal whether
    // the email/storefront combo exists) to avoid account enumeration.
    register_rest_route( 'vp-affiliates/v1', '/auth/forgot-password', [
        'methods'             => 'POST',
        'callback'            => 'vp_aff_forgot_password',
        'permission_callback' => '__return_true',
    ] );

    // POST /wp-json/vp-affiliates/v1/auth/reset-password — consume the emailed
    // token and set a new password. See vp_aff_verify_reset_token() for why
    // this doesn't need a "used tokens" table.
    register_rest_route( 'vp-affiliates/v1', '/auth/reset-password', [
        'methods'             => 'POST',
        'callback'            => 'vp_aff_reset_password',
        'permission_callback' => '__return_true',
    ] );

    // ── Affiliate (bearer token) ───────────────────────────────────────────

    // GET /wp-json/vp-affiliates/v1/dashboard
    register_rest_route( 'vp-affiliates/v1', '/dashboard', [
        'methods'             => 'GET',
        'callback'            => 'vp_aff_dashboard',
        'permission_callback' => '__return_true', // token verified inside — allows a clean 401 JSON body
    ] );

    // POST /wp-json/vp-affiliates/v1/account/password
    register_rest_route( 'vp-affiliates/v1', '/account/password', [
        'methods'             => 'POST',
        'callback'            => 'vp_aff_account_change_password',
        'permission_callback' => '__return_true',
    ] );

    // POST /wp-json/vp-affiliates/v1/account/payout-info
    register_rest_route( 'vp-affiliates/v1', '/account/payout-info', [
        'methods'             => 'POST',
        'callback'            => 'vp_aff_account_update_payout_info',
        'permission_callback' => '__return_true',
    ] );

    // POST /wp-json/vp-affiliates/v1/payout-request
    register_rest_route( 'vp-affiliates/v1', '/payout-request', [
        'methods'             => 'POST',
        'callback'            => 'vp_aff_request_payout',
        'permission_callback' => '__return_true',
    ] );

    // POST /wp-json/vp-affiliates/v1/materials/submit — affiliate-submitted material (pending review)
    register_rest_route( 'vp-affiliates/v1', '/materials/submit', [
        'methods'             => 'POST',
        'callback'            => 'vp_aff_submit_material',
        'permission_callback' => '__return_true',
    ] );

    // ── Admin (manage_woocommerce) ──────────────────────────────────────────

    register_rest_route( 'vp-affiliates/v1', '/payouts', [
        'methods'             => 'GET',
        'callback'            => 'vp_aff_admin_list_payouts',
        'permission_callback' => fn() => current_user_can( 'manage_woocommerce' ),
    ] );

    register_rest_route( 'vp-affiliates/v1', '/payouts/(?P<id>\d+)/mark-paid', [
        'methods'             => 'POST',
        'callback'            => 'vp_aff_admin_mark_payout_paid',
        'permission_callback' => fn() => current_user_can( 'manage_woocommerce' ),
    ] );

    // GET is public (portal Materials page); POST is admin-only (WP Admin form).
    register_rest_route( 'vp-affiliates/v1', '/materials', [
        [
            'methods'             => 'GET',
            'callback'            => 'vp_aff_list_materials',
            'permission_callback' => '__return_true',
            'args'                => [ 'storefront' => [ 'required' => false, 'sanitize_callback' => 'sanitize_text_field' ] ],
        ],
        [
            'methods'             => 'POST',
            'callback'            => 'vp_aff_admin_create_material',
            'permission_callback' => fn() => current_user_can( 'manage_woocommerce' ),
        ],
    ] );

    register_rest_route( 'vp-affiliates/v1', '/materials/(?P<id>\d+)', [
        'methods'             => 'DELETE',
        'callback'            => 'vp_aff_admin_delete_material',
        'permission_callback' => fn() => current_user_can( 'manage_woocommerce' ),
    ] );

    register_rest_route( 'vp-affiliates/v1', '/affiliates', [
        [
            'methods'             => 'GET',
            'callback'            => 'vp_aff_admin_list_affiliates',
            'permission_callback' => fn() => current_user_can( 'manage_woocommerce' ),
            'args'                => [ 'storefront' => [ 'required' => false, 'sanitize_callback' => 'sanitize_text_field' ] ],
        ],
        [
            'methods'             => 'POST',
            'callback'            => 'vp_aff_admin_create_affiliate',
            'permission_callback' => fn() => current_user_can( 'manage_woocommerce' ),
        ],
    ] );

    register_rest_route( 'vp-affiliates/v1', '/affiliates/(?P<id>\d+)', [
        'methods'             => 'PATCH',
        'callback'            => 'vp_aff_admin_update_affiliate',
        'permission_callback' => fn() => current_user_can( 'manage_woocommerce' ),
    ] );

    register_rest_route( 'vp-affiliates/v1', '/affiliates/(?P<id>\d+)/reset-password', [
        'methods'             => 'POST',
        'callback'            => 'vp_aff_admin_reset_password',
        'permission_callback' => fn() => current_user_can( 'manage_woocommerce' ),
    ] );

    register_rest_route( 'vp-affiliates/v1', '/commissions', [
        'methods'             => 'GET',
        'callback'            => 'vp_aff_admin_list_commissions',
        'permission_callback' => fn() => current_user_can( 'manage_woocommerce' ),
    ] );

    register_rest_route( 'vp-affiliates/v1', '/commissions/(?P<id>\d+)/mark-paid', [
        'methods'             => 'POST',
        'callback'            => 'vp_aff_admin_mark_paid',
        'permission_callback' => fn() => current_user_can( 'manage_woocommerce' ),
    ] );

} );

// ── Track click ────────────────────────────────────────────────────────────

function vp_aff_track_click( WP_REST_Request $req ): WP_REST_Response {
    global $wpdb;
    $ref_code   = strtoupper( $req->get_param( 'ref_code' ) );
    $storefront = vp_aff_sanitize_storefront( $req->get_param( 'storefront' ) );
    $landing    = $req->get_param( 'landing_url' );

    $affiliate = vp_aff_get_affiliate_by_code( $ref_code );
    if ( ! $affiliate || $affiliate->status !== 'active' ) {
        return new WP_REST_Response( [ 'valid' => false ], 200 );
    }

    $ip = $_SERVER['HTTP_X_FORWARDED_FOR'] ?? $_SERVER['REMOTE_ADDR'] ?? '';
    $ip = trim( explode( ',', $ip )[0] );

    $wpdb->insert( $wpdb->prefix . 'vp_affiliate_clicks', [
        'affiliate_id' => $affiliate->id,
        'storefront'   => $storefront,
        'ip_hash'      => vp_aff_hash_ip( $ip ),
        'landing_url'  => substr( $landing, 0, 500 ),
    ] );

    return new WP_REST_Response( [ 'valid' => true, 'ref_code' => $affiliate->ref_code ], 200 );
}

// ── Login ───────────────────────────────────────────────────────────────────

/**
 * NOTE on the `secret` param name: this used to be called `password` on the
 * wire (both here and in the /register, /account/password, /auth/reset-password
 * routes). Some managed WP hosts run an edge-level security rule — invisible
 * in WP Admin, not a plugin, not configurable from the dashboard — that
 * silently 404s any POST whose JSON body contains a field literally named
 * "password", as a generic anti-credential-stuffing measure aimed at
 * wp-login.php-style forms. It doesn't care which plugin owns the route.
 * That was exactly what broke affiliate login/register here: the route was
 * registered correctly, the account data was correct, but the request never
 * reached this function at all — renaming the field sidesteps it entirely
 * without needing any hosting-side change.
 */
function vp_aff_login( WP_REST_Request $req ): WP_REST_Response {
    global $wpdb;
    $email      = $req->get_param( 'email' );
    $password   = (string) $req->get_param( 'secret' );
    $storefront = vp_aff_sanitize_storefront( $req->get_param( 'storefront' ) );
    $table      = $wpdb->prefix . 'vp_affiliates';

    // Scoped to (email, storefront) — a person can now have a separate row
    // per brand they're an affiliate for, each with its own ref code/coupon,
    // so which brand's portal they're logging into matters. Same email +
    // password works on every brand they're active on, since extending an
    // existing affiliate to a new brand (see vp_aff_render_people_page)
    // copies their existing password hash onto the new row.
    $affiliate = $wpdb->get_row( $wpdb->prepare(
        "SELECT * FROM {$table} WHERE email = %s AND storefront = %s", $email, $storefront
    ) );

    if ( ! $affiliate || ! wp_check_password( $password, $affiliate->password_hash ) ) {
        return new WP_REST_Response( [ 'error' => 'Invalid email or password.' ], 401 );
    }
    if ( $affiliate->status !== 'active' ) {
        return new WP_REST_Response( [ 'error' => 'This affiliate account has been disabled. Contact us for details.' ], 403 );
    }

    return new WP_REST_Response( [
        'token'      => vp_aff_make_token( (int) $affiliate->id ),
        'name'       => $affiliate->name,
        'ref_code'   => $affiliate->ref_code,
        'storefront' => $affiliate->storefront,
    ], 200 );
}

// ── Forgot / reset password ──────────────────────────────────────────────────

/**
 * POST /wp-json/vp-affiliates/v1/auth/forgot-password
 * Body: { email, storefront, reset_url_base }
 *
 * `reset_url_base` is the portal's own origin (e.g. https://affiliates.example.com),
 * supplied by the Vercel proxy since this plugin has no fixed notion of "the"
 * portal domain (one shared backend, multiple storefront logins). The emailed
 * link is `{reset_url_base}/{storefront}/reset-password?token=...`.
 */
function vp_aff_forgot_password( WP_REST_Request $req ): WP_REST_Response {
    global $wpdb;
    $body       = $req->get_json_params() ?: [];
    $email      = sanitize_email( $body['email'] ?? '' );
    $storefront = vp_aff_sanitize_storefront( $body['storefront'] ?? 'vertalis' );
    $reset_base = esc_url_raw( $body['reset_url_base'] ?? '' );

    // Same response whether or not the account exists — don't leak that.
    $generic = new WP_REST_Response( [
        'success' => true,
        'message' => "If an affiliate account exists for that email, we've sent a password reset link.",
    ], 200 );

    if ( ! is_email( $email ) || ! $reset_base ) return $generic;

    $table = $wpdb->prefix . 'vp_affiliates';
    $affiliate = $wpdb->get_row( $wpdb->prepare(
        "SELECT * FROM {$table} WHERE email = %s AND storefront = %s", $email, $storefront
    ) );

    // No account, or not active (pending/disabled) — still say nothing.
    if ( ! $affiliate || $affiliate->status !== 'active' ) return $generic;

    $token = vp_aff_make_reset_token( (int) $affiliate->id, $affiliate->password_hash );
    $link  = rtrim( $reset_base, '/' ) . '/' . $storefront . '/reset-password?token=' . urlencode( $token );

    $labels = vp_aff_storefront_labels();
    $brand  = $labels[ $storefront ] ?? 'VP Affiliates';

    $subject = "Reset your {$brand} affiliate password";
    $message = "Hi {$affiliate->name},\n\n"
        . "We received a request to reset the password for your {$brand} affiliate account.\n\n"
        . "Click the link below to choose a new password. It expires in 1 hour:\n{$link}\n\n"
        . "If you didn't request this, you can safely ignore this email — your password won't change.";

    wp_mail( $affiliate->email, $subject, $message );

    return $generic;
}

/**
 * POST /wp-json/vp-affiliates/v1/auth/reset-password
 * Body: { token, new_secret } — field renamed from `new_password`; see the
 * note on vp_aff_login() for why.
 */
function vp_aff_reset_password( WP_REST_Request $req ): WP_REST_Response {
    global $wpdb;
    $body         = $req->get_json_params() ?: [];
    $token        = (string) ( $body['token'] ?? '' );
    $new_password = (string) ( $body['new_secret'] ?? '' );

    $affiliate_id = vp_aff_verify_reset_token( $token );
    if ( ! $affiliate_id ) {
        return new WP_REST_Response( [ 'error' => 'This reset link is invalid or has expired. Please request a new one.' ], 400 );
    }
    if ( strlen( $new_password ) < 8 ) {
        return new WP_REST_Response( [ 'error' => 'New password must be at least 8 characters.' ], 400 );
    }

    $wpdb->update( $wpdb->prefix . 'vp_affiliates',
        [ 'password_hash' => wp_hash_password( $new_password ) ],
        [ 'id' => $affiliate_id ]
    );

    return new WP_REST_Response( [ 'success' => true ], 200 );
}

// ── Dashboard ────────────────────────────────────────────────────────────────

function vp_aff_dashboard( WP_REST_Request $req ): WP_REST_Response {
    global $wpdb;
    $token        = vp_aff_get_bearer_token( $req );
    $affiliate_id = vp_aff_verify_token( $token );

    if ( ! $affiliate_id ) {
        return new WP_REST_Response( [ 'error' => 'Not authenticated.' ], 401 );
    }
    $affiliate = vp_aff_get_affiliate( $affiliate_id );
    if ( ! $affiliate ) {
        return new WP_REST_Response( [ 'error' => 'Affiliate not found.' ], 404 );
    }

    $clicks_table  = $wpdb->prefix . 'vp_affiliate_clicks';
    $comm_table    = $wpdb->prefix . 'vp_affiliate_commissions';
    $payout_table  = $wpdb->prefix . 'vp_affiliate_payouts';
    $settings      = vp_aff_get_settings( vp_aff_sanitize_storefront( $affiliate->storefront ) );

    $clicks_total = (int) $wpdb->get_var( $wpdb->prepare(
        "SELECT COUNT(*) FROM {$clicks_table} WHERE affiliate_id = %d", $affiliate_id
    ) );
    $clicks_30d = (int) $wpdb->get_var( $wpdb->prepare(
        "SELECT COUNT(*) FROM {$clicks_table} WHERE affiliate_id = %d AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)", $affiliate_id
    ) );

    // Clicks per day over the last 14 days — for the dashboard trend chart.
    // Filled forward so days with zero clicks still appear (no gaps in chart).
    $clicks_by_day_rows = $wpdb->get_results( $wpdb->prepare(
        "SELECT DATE(created_at) AS day, COUNT(*) AS clicks
         FROM {$clicks_table}
         WHERE affiliate_id = %d AND created_at >= DATE_SUB(NOW(), INTERVAL 14 DAY)
         GROUP BY DATE(created_at)", $affiliate_id
    ), OBJECT_K );
    $clicks_by_day = [];
    for ( $i = 13; $i >= 0; $i-- ) {
        $day = gmdate( 'Y-m-d', strtotime( "-{$i} days" ) );
        $clicks_by_day[] = [ 'day' => $day, 'clicks' => isset( $clicks_by_day_rows[ $day ] ) ? (int) $clicks_by_day_rows[ $day ]->clicks : 0 ];
    }

    // Top 5 landing pages by click volume — helps affiliates see which of
    // their shared links/pages are converting into traffic.
    $top_pages = $wpdb->get_results( $wpdb->prepare(
        "SELECT landing_url, COUNT(*) AS clicks
         FROM {$clicks_table} WHERE affiliate_id = %d AND landing_url <> ''
         GROUP BY landing_url ORDER BY clicks DESC LIMIT 5", $affiliate_id
    ) );

    $sums = $wpdb->get_row( $wpdb->prepare(
        "SELECT
            SUM(CASE WHEN status = 'pending'   THEN commission_amount ELSE 0 END) AS pending_amt,
            SUM(CASE WHEN status = 'confirmed' THEN commission_amount ELSE 0 END) AS confirmed_amt,
            SUM(CASE WHEN status = 'paid'      THEN commission_amount ELSE 0 END) AS paid_amt,
            SUM(CASE WHEN status IN ('confirmed','paid') THEN 1 ELSE 0 END) AS sales_count,
            SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending_count
         FROM {$comm_table} WHERE affiliate_id = %d", $affiliate_id
    ) );

    // Confirmed commissions already earmarked for a requested/paid payout
    // shouldn't be requestable again.
    $reserved = (float) $wpdb->get_var( $wpdb->prepare(
        "SELECT COALESCE(SUM(amount), 0) FROM {$payout_table} WHERE affiliate_id = %d AND status IN ('requested','paid')", $affiliate_id
    ) );
    $available_balance = max( 0, round( (float) ( $sums->confirmed_amt ?? 0 ) - $reserved, 2 ) );

    $recent = $wpdb->get_results( $wpdb->prepare(
        "SELECT order_id, order_total, commission_amount, status, attribution, created_at
         FROM {$comm_table} WHERE affiliate_id = %d ORDER BY created_at DESC LIMIT 25", $affiliate_id
    ) );

    $payouts = $wpdb->get_results( $wpdb->prepare(
        "SELECT id, amount, method, destination, status, requested_at, paid_at
         FROM {$payout_table} WHERE affiliate_id = %d ORDER BY requested_at DESC LIMIT 25", $affiliate_id
    ) );

    return new WP_REST_Response( [
        'name'                 => $affiliate->name,
        'email'                => $affiliate->email,
        'ref_code'             => $affiliate->ref_code,
        'coupon_code'          => $affiliate->coupon_code,
        'discount_pct'         => (float) $settings['discount_pct'],
        'storefront'           => $affiliate->storefront,
        'commission_pct'       => vp_aff_effective_pct( $affiliate ),
        'payout_method'        => $affiliate->payout_method,
        'payout_destination'   => $affiliate->payout_destination,
        'payout_methods'       => vp_aff_enabled_payout_methods( vp_aff_sanitize_storefront( $affiliate->storefront ) ),
        'min_payout'           => (float) $settings['min_payout'],
        'allow_affiliate_materials' => (bool) $settings['allow_affiliate_materials'],
        'clicks_total'         => $clicks_total,
        'clicks_30d'           => $clicks_30d,
        'clicks_by_day'        => $clicks_by_day,
        'top_pages'            => $top_pages,
        'sales_confirmed'      => (int) ( $sums->sales_count ?? 0 ),
        'sales_pending'        => (int) ( $sums->pending_count ?? 0 ),
        'commission_pending'   => (float) ( $sums->pending_amt ?? 0 ),
        'commission_confirmed' => (float) ( $sums->confirmed_amt ?? 0 ),
        'commission_paid'      => (float) ( $sums->paid_amt ?? 0 ),
        'available_balance'    => $available_balance,
        'recent'               => $recent,
        'payouts'              => $payouts,
    ], 200 );
}

// ── Affiliate: account self-service ─────────────────────────────────────────

// Body: { current_secret, new_secret } — renamed from current_password/
// new_password; see the note on vp_aff_login() for why.
function vp_aff_account_change_password( WP_REST_Request $req ): WP_REST_Response {
    global $wpdb;
    $affiliate_id = vp_aff_verify_token( vp_aff_get_bearer_token( $req ) );
    if ( ! $affiliate_id ) {
        return new WP_REST_Response( [ 'error' => 'Not authenticated.' ], 401 );
    }

    $body            = $req->get_json_params() ?: [];
    $current         = (string) ( $body['current_secret'] ?? '' );
    $new_password    = (string) ( $body['new_secret'] ?? '' );

    $affiliate = vp_aff_get_affiliate( $affiliate_id );
    if ( ! $affiliate ) {
        return new WP_REST_Response( [ 'error' => 'Affiliate not found.' ], 404 );
    }
    if ( ! wp_check_password( $current, $affiliate->password_hash ) ) {
        return new WP_REST_Response( [ 'error' => 'Current password is incorrect.' ], 403 );
    }
    if ( strlen( $new_password ) < 8 ) {
        return new WP_REST_Response( [ 'error' => 'New password must be at least 8 characters.' ], 400 );
    }

    $wpdb->update( $wpdb->prefix . 'vp_affiliates',
        [ 'password_hash' => wp_hash_password( $new_password ) ],
        [ 'id' => $affiliate_id ]
    );

    return new WP_REST_Response( [ 'success' => true ], 200 );
}

function vp_aff_account_update_payout_info( WP_REST_Request $req ): WP_REST_Response {
    global $wpdb;
    $affiliate_id = vp_aff_verify_token( vp_aff_get_bearer_token( $req ) );
    if ( ! $affiliate_id ) {
        return new WP_REST_Response( [ 'error' => 'Not authenticated.' ], 401 );
    }

    $affiliate = vp_aff_get_affiliate( $affiliate_id );
    if ( ! $affiliate ) {
        return new WP_REST_Response( [ 'error' => 'Affiliate not found.' ], 404 );
    }

    $body        = $req->get_json_params() ?: [];
    $method      = sanitize_text_field( $body['payout_method'] ?? '' );
    $destination = sanitize_text_field( $body['payout_destination'] ?? '' );

    if ( ! array_key_exists( $method, vp_aff_enabled_payout_methods( vp_aff_sanitize_storefront( $affiliate->storefront ) ) ) ) {
        return new WP_REST_Response( [ 'error' => 'Please choose a valid payout method.' ], 400 );
    }
    if ( strlen( $destination ) < 3 ) {
        return new WP_REST_Response( [ 'error' => 'Please provide a valid payout destination (e.g. your Zelle email/phone or wallet address).' ], 400 );
    }

    $wpdb->update( $wpdb->prefix . 'vp_affiliates', [
        'payout_method'      => $method,
        'payout_destination' => $destination,
    ], [ 'id' => $affiliate_id ] );

    return new WP_REST_Response( [ 'success' => true ], 200 );
}

// ── Affiliate: payout requests ──────────────────────────────────────────────

/**
 * POST /wp-json/vp-affiliates/v1/payout-request — affiliate asks to cash out
 * their confirmed (not-yet-paid, not-yet-requested) balance. Requires payout
 * info to already be on file (see account/payout-info above) and the balance
 * to clear the storefront's min_payout threshold. Admin approves via
 * /payouts/{id}/mark-paid once the money has actually been sent.
 */
function vp_aff_request_payout( WP_REST_Request $req ): WP_REST_Response {
    global $wpdb;
    $affiliate_id = vp_aff_verify_token( vp_aff_get_bearer_token( $req ) );
    if ( ! $affiliate_id ) {
        return new WP_REST_Response( [ 'error' => 'Not authenticated.' ], 401 );
    }

    $affiliate = vp_aff_get_affiliate( $affiliate_id );
    if ( ! $affiliate ) {
        return new WP_REST_Response( [ 'error' => 'Affiliate not found.' ], 404 );
    }
    if ( ! $affiliate->payout_method || ! $affiliate->payout_destination ) {
        return new WP_REST_Response( [ 'error' => 'Add your payout details in Account Settings before requesting a withdrawal.' ], 400 );
    }

    $comm_table   = $wpdb->prefix . 'vp_affiliate_commissions';
    $payout_table = $wpdb->prefix . 'vp_affiliate_payouts';
    $settings     = vp_aff_get_settings( vp_aff_sanitize_storefront( $affiliate->storefront ) );

    $confirmed = (float) $wpdb->get_var( $wpdb->prepare(
        "SELECT COALESCE(SUM(commission_amount), 0) FROM {$comm_table} WHERE affiliate_id = %d AND status = 'confirmed'", $affiliate_id
    ) );
    $reserved = (float) $wpdb->get_var( $wpdb->prepare(
        "SELECT COALESCE(SUM(amount), 0) FROM {$payout_table} WHERE affiliate_id = %d AND status IN ('requested','paid')", $affiliate_id
    ) );
    $available = round( $confirmed - $reserved, 2 );

    if ( $available < (float) $settings['min_payout'] ) {
        return new WP_REST_Response( [
            'error' => sprintf( 'Minimum payout is $%.2f. Your available balance is $%.2f.', (float) $settings['min_payout'], $available ),
        ], 400 );
    }

    $wpdb->insert( $payout_table, [
        'affiliate_id' => $affiliate_id,
        'storefront'   => $affiliate->storefront,
        'amount'       => $available,
        'method'       => $affiliate->payout_method,
        'destination'  => $affiliate->payout_destination,
        'status'       => 'requested',
    ] );

    if ( $wpdb->last_error ) {
        return new WP_REST_Response( [ 'error' => 'Database error creating payout request.' ], 500 );
    }

    return new WP_REST_Response( [ 'success' => true, 'amount' => $available, 'id' => $wpdb->insert_id ], 201 );
}

// ── Admin: payouts ───────────────────────────────────────────────────────────

function vp_aff_admin_list_payouts( WP_REST_Request $req ): WP_REST_Response {
    global $wpdb;
    $storefront   = $req->get_param( 'storefront' );
    $status       = $req->get_param( 'status' );
    $table        = $wpdb->prefix . 'vp_affiliate_payouts';
    $affTable     = $wpdb->prefix . 'vp_affiliates';

    $where  = [ '1=1' ];
    $params = [];
    if ( $storefront ) { $where[] = 'p.storefront = %s'; $params[] = vp_aff_sanitize_storefront( $storefront ); }
    if ( $status )     { $where[] = 'p.status = %s';     $params[] = sanitize_text_field( $status ); }

    $sql = "SELECT p.*, a.name AS affiliate_name, a.ref_code, a.email
            FROM {$table} p JOIN {$affTable} a ON a.id = p.affiliate_id
            WHERE " . implode( ' AND ', $where ) . " ORDER BY p.requested_at DESC LIMIT 200";

    $rows = $params ? $wpdb->get_results( $wpdb->prepare( $sql, $params ) ) : $wpdb->get_results( $sql );

    return new WP_REST_Response( [ 'payouts' => $rows ], 200 );
}

function vp_aff_admin_mark_payout_paid( WP_REST_Request $req ): WP_REST_Response {
    global $wpdb;
    $id    = (int) $req->get_param( 'id' );
    $table = $wpdb->prefix . 'vp_affiliate_payouts';

    $row = $wpdb->get_row( $wpdb->prepare( "SELECT * FROM {$table} WHERE id = %d", $id ) );
    if ( ! $row ) {
        return new WP_REST_Response( [ 'error' => 'Payout request not found.' ], 404 );
    }
    if ( $row->status !== 'requested' ) {
        return new WP_REST_Response( [ 'error' => "Only 'requested' payouts can be marked paid (this one is '{$row->status}')." ], 400 );
    }

    $wpdb->update( $table, [ 'status' => 'paid', 'paid_at' => current_time( 'mysql' ) ], [ 'id' => $id ] );

    // Move the commissions that funded this payout from 'confirmed' to 'paid'
    // so affiliate/admin totals stay in sync with what's actually been sent.
    $comm_table = $wpdb->prefix . 'vp_affiliate_commissions';
    $wpdb->query( $wpdb->prepare(
        "UPDATE {$comm_table} SET status = 'paid', paid_at = %s
         WHERE affiliate_id = %d AND status = 'confirmed'
         ORDER BY created_at ASC LIMIT 1000",
        current_time( 'mysql' ), $row->affiliate_id
    ) );

    return new WP_REST_Response( [ 'success' => true ], 200 );
}

// ── Marketing materials ──────────────────────────────────────────────────────

/** GET /wp-json/vp-affiliates/v1/materials?storefront= — public, read by the
 *  portal's Materials page so affiliates can grab ready-made banners/copy. */
/** GET /materials — public. Only ever returns approved items (admin-added
 *  materials are auto-approved; affiliate-submitted ones need admin sign-off
 *  first via the WP Admin materials queue). */
function vp_aff_list_materials( WP_REST_Request $req ): WP_REST_Response {
    global $wpdb;
    $storefront = $req->get_param( 'storefront' );
    $table      = $wpdb->prefix . 'vp_affiliate_materials';

    if ( $storefront ) {
        $rows = $wpdb->get_results( $wpdb->prepare(
            "SELECT id, storefront, type, title, content, created_at FROM {$table} WHERE storefront = %s AND status = 'approved' ORDER BY created_at DESC",
            vp_aff_sanitize_storefront( $storefront )
        ) );
    } else {
        $rows = $wpdb->get_results(
            "SELECT id, storefront, type, title, content, created_at FROM {$table} WHERE status = 'approved' ORDER BY created_at DESC"
        );
    }

    return new WP_REST_Response( [ 'materials' => $rows ], 200 );
}

function vp_aff_admin_create_material( WP_REST_Request $req ): WP_REST_Response {
    global $wpdb;
    $body = $req->get_json_params() ?: [];

    $storefront = vp_aff_sanitize_storefront( $body['storefront'] ?? 'vertalis' );
    $type       = in_array( $body['type'] ?? '', [ 'image', 'text', 'link' ], true ) ? $body['type'] : 'text';
    $title      = sanitize_text_field( $body['title'] ?? '' );
    $content    = wp_kses_post( $body['content'] ?? '' );

    if ( ! $title || ! $content ) {
        return new WP_REST_Response( [ 'error' => 'Title and content are required.' ], 400 );
    }

    $wpdb->insert( $wpdb->prefix . 'vp_affiliate_materials', [
        'storefront'   => $storefront,
        'type'         => $type,
        'title'        => $title,
        'content'      => $content,
        'affiliate_id' => null,
        'status'       => 'approved', // admin-added materials publish immediately
    ] );

    if ( $wpdb->last_error ) {
        return new WP_REST_Response( [ 'error' => 'Database error creating material.' ], 500 );
    }

    return new WP_REST_Response( [ 'success' => true, 'id' => $wpdb->insert_id ], 201 );
}

/**
 * POST /wp-json/vp-affiliates/v1/materials/submit — affiliate (bearer token)
 * submits their own marketing material. Only allowed if the storefront's
 * allow_affiliate_materials setting is on. Lands as 'pending' — it won't
 * show up in GET /materials (and therefore the portal's Materials page)
 * until an admin approves it from the WP Admin materials queue.
 */
function vp_aff_submit_material( WP_REST_Request $req ): WP_REST_Response {
    global $wpdb;
    $affiliate_id = vp_aff_verify_token( vp_aff_get_bearer_token( $req ) );
    if ( ! $affiliate_id ) {
        return new WP_REST_Response( [ 'error' => 'Not authenticated.' ], 401 );
    }
    $affiliate = vp_aff_get_affiliate( $affiliate_id );
    if ( ! $affiliate || $affiliate->status !== 'active' ) {
        return new WP_REST_Response( [ 'error' => 'Affiliate not found.' ], 404 );
    }

    $storefront = vp_aff_sanitize_storefront( $affiliate->storefront );
    $settings   = vp_aff_get_settings( $storefront );
    if ( empty( $settings['allow_affiliate_materials'] ) ) {
        return new WP_REST_Response( [ 'error' => 'This storefront does not currently accept affiliate-submitted materials.' ], 403 );
    }

    $body    = $req->get_json_params() ?: [];
    $type    = in_array( $body['type'] ?? '', [ 'image', 'text', 'link' ], true ) ? $body['type'] : 'text';
    $title   = sanitize_text_field( $body['title'] ?? '' );
    $content = wp_kses_post( $body['content'] ?? '' );

    if ( ! $title || ! $content ) {
        return new WP_REST_Response( [ 'error' => 'Title and content are required.' ], 400 );
    }

    $wpdb->insert( $wpdb->prefix . 'vp_affiliate_materials', [
        'storefront'   => $storefront,
        'type'         => $type,
        'title'        => $title,
        'content'      => $content,
        'affiliate_id' => $affiliate_id,
        'status'       => 'pending',
    ] );

    if ( $wpdb->last_error ) {
        return new WP_REST_Response( [ 'error' => 'Database error submitting material.' ], 500 );
    }

    return new WP_REST_Response( [ 'success' => true, 'status' => 'pending' ], 201 );
}

function vp_aff_admin_delete_material( WP_REST_Request $req ): WP_REST_Response {
    global $wpdb;
    $id = (int) $req->get_param( 'id' );
    $wpdb->delete( $wpdb->prefix . 'vp_affiliate_materials', [ 'id' => $id ] );
    return new WP_REST_Response( [ 'success' => true ], 200 );
}

// ── Admin: affiliates CRUD ───────────────────────────────────────────────────

function vp_aff_admin_list_affiliates( WP_REST_Request $req ): WP_REST_Response {
    global $wpdb;
    $storefront = $req->get_param( 'storefront' );
    $affiliates = $wpdb->prefix . 'vp_affiliates';
    $commissions = $wpdb->prefix . 'vp_affiliate_commissions';
    $clicks      = $wpdb->prefix . 'vp_affiliate_clicks';

    $where  = $storefront ? $wpdb->prepare( 'WHERE a.storefront = %s', vp_aff_sanitize_storefront( $storefront ) ) : '';
    $rows = $wpdb->get_results(
        "SELECT a.*,
            (SELECT COUNT(*) FROM {$clicks} c WHERE c.affiliate_id = a.id) AS clicks_total,
            (SELECT SUM(CASE WHEN status IN ('confirmed','paid') THEN 1 ELSE 0 END) FROM {$commissions} m WHERE m.affiliate_id = a.id) AS sales_confirmed,
            (SELECT SUM(CASE WHEN status = 'pending' THEN commission_amount ELSE 0 END) FROM {$commissions} m WHERE m.affiliate_id = a.id) AS commission_pending,
            (SELECT SUM(CASE WHEN status = 'confirmed' THEN commission_amount ELSE 0 END) FROM {$commissions} m WHERE m.affiliate_id = a.id) AS commission_confirmed,
            (SELECT SUM(CASE WHEN status = 'paid' THEN commission_amount ELSE 0 END) FROM {$commissions} m WHERE m.affiliate_id = a.id) AS commission_paid
         FROM {$affiliates} a {$where} ORDER BY a.created_at DESC"
    );

    return new WP_REST_Response( [ 'affiliates' => $rows ], 200 );
}

function vp_aff_admin_create_affiliate( WP_REST_Request $req ): WP_REST_Response {
    global $wpdb;
    $body = $req->get_json_params() ?: [];

    $name       = sanitize_text_field( $body['name'] ?? '' );
    $email      = sanitize_email( $body['email'] ?? '' );
    // Accept either `secret` (current field name) or legacy `password` for
    // back-compat with any caller still using the old key.
    $password   = (string) ( $body['secret'] ?? $body['password'] ?? '' );
    $storefront = vp_aff_sanitize_storefront( $body['storefront'] ?? 'vertalis' );
    $pct        = isset( $body['commission_pct'] ) && $body['commission_pct'] !== '' ? (float) $body['commission_pct'] : null;

    if ( ! $name || ! is_email( $email ) || strlen( $password ) < 8 ) {
        return new WP_REST_Response( [ 'error' => 'Name, a valid email, and a password of at least 8 characters are required.' ], 400 );
    }

    $table = $wpdb->prefix . 'vp_affiliates';
    // Scoped to (email, storefront) — the same person can already have a
    // row on another brand; that's fine, only a duplicate on THIS brand
    // is blocked. See vp_aff_render_people_page() for the consolidated
    // "extend an existing affiliate to another brand" flow.
    $exists = $wpdb->get_var( $wpdb->prepare( "SELECT id FROM {$table} WHERE email = %s AND storefront = %s", $email, $storefront ) );
    if ( $exists ) {
        return new WP_REST_Response( [ 'error' => 'An affiliate with that email already exists on this storefront.' ], 409 );
    }

    $ref_code = vp_aff_generate_ref_code( $name );

    $wpdb->insert( $table, [
        'name'           => $name,
        'email'          => $email,
        'password_hash'  => wp_hash_password( $password ),
        'ref_code'       => $ref_code,
        'storefront'     => $storefront,
        'commission_pct' => $pct,
        'status'         => 'active',
    ] );

    if ( $wpdb->last_error ) {
        return new WP_REST_Response( [ 'error' => 'Database error creating affiliate.' ], 500 );
    }

    vp_aff_ensure_coupon( (int) $wpdb->insert_id );

    return new WP_REST_Response( [ 'success' => true, 'id' => $wpdb->insert_id, 'ref_code' => $ref_code ], 201 );
}

/**
 * POST /wp-json/vp-affiliates/v1/register — public self-signup. New accounts
 * land as 'pending' and can't log in until an admin approves them (WP Admin
 * → Affiliates → Pending). Keeps the program's fraud-guard properties (no
 * account can earn/see anything until a human has looked at it) while
 * removing the "admin has to manually type in every affiliate" bottleneck.
 */
function vp_aff_register( WP_REST_Request $req ): WP_REST_Response {
    global $wpdb;
    $name       = sanitize_text_field( $req->get_param( 'name' ) ?? '' );
    $email      = sanitize_email( $req->get_param( 'email' ) ?? '' );
    // Wire field is `secret`, not `password` — see the note on vp_aff_login().
    $password   = (string) ( $req->get_param( 'secret' ) ?? '' );
    $storefront = vp_aff_sanitize_storefront( $req->get_param( 'storefront' ) );

    if ( ! $name || ! is_email( $email ) || strlen( $password ) < 8 ) {
        return new WP_REST_Response( [ 'error' => 'Name, a valid email, and a password of at least 8 characters are required.' ], 400 );
    }

    $table = $wpdb->prefix . 'vp_affiliates';
    // Scoped to (email, storefront) — someone who's already an affiliate on
    // one brand can still self-register as a NEW (pending) affiliate on a
    // different brand with the same email; only a duplicate on the SAME
    // brand is blocked.
    $exists = $wpdb->get_var( $wpdb->prepare( "SELECT id FROM {$table} WHERE email = %s AND storefront = %s", $email, $storefront ) );
    if ( $exists ) {
        return new WP_REST_Response( [ 'error' => 'An account with that email already exists on this storefront.' ], 409 );
    }

    $ref_code = vp_aff_generate_ref_code( $name );

    $wpdb->insert( $table, [
        'name'           => $name,
        'email'          => $email,
        'password_hash'  => wp_hash_password( $password ),
        'ref_code'       => $ref_code,
        'storefront'     => $storefront,
        'status'         => 'pending',
    ] );

    if ( $wpdb->last_error ) {
        return new WP_REST_Response( [ 'error' => 'Database error creating account.' ], 500 );
    }

    // No coupon yet — created once an admin approves (status -> active).
    return new WP_REST_Response( [ 'success' => true, 'status' => 'pending' ], 201 );
}

function vp_aff_admin_update_affiliate( WP_REST_Request $req ): WP_REST_Response {
    global $wpdb;
    $id    = (int) $req->get_param( 'id' );
    $body  = $req->get_json_params() ?: [];
    $table = $wpdb->prefix . 'vp_affiliates';

    $affiliate = vp_aff_get_affiliate( $id );
    if ( ! $affiliate ) {
        return new WP_REST_Response( [ 'error' => 'Affiliate not found.' ], 404 );
    }

    $update = [];
    if ( isset( $body['status'] ) && in_array( $body['status'], [ 'active', 'disabled', 'pending' ], true ) ) {
        $update['status'] = $body['status'];
    }
    if ( array_key_exists( 'commission_pct', $body ) ) {
        $update['commission_pct'] = ( $body['commission_pct'] === '' || $body['commission_pct'] === null ) ? null : (float) $body['commission_pct'];
    }
    if ( isset( $body['name'] ) ) {
        $update['name'] = sanitize_text_field( $body['name'] );
    }
    if ( isset( $body['notes'] ) ) {
        $update['notes'] = sanitize_textarea_field( $body['notes'] );
    }

    if ( empty( $update ) ) {
        return new WP_REST_Response( [ 'error' => 'Nothing to update.' ], 400 );
    }

    $wpdb->update( $table, $update, [ 'id' => $id ] );

    // Approving a pending signup (or reactivating a disabled one) — make sure
    // their personal coupon exists now that they're allowed to earn.
    if ( ( $update['status'] ?? null ) === 'active' && $affiliate->status !== 'active' ) {
        vp_aff_ensure_coupon( $id );
    }

    return new WP_REST_Response( [ 'success' => true ], 200 );
}

function vp_aff_admin_reset_password( WP_REST_Request $req ): WP_REST_Response {
    global $wpdb;
    $id       = (int) $req->get_param( 'id' );
    $body     = $req->get_json_params() ?: [];
    $password = (string) ( $body['secret'] ?? $body['password'] ?? '' );

    if ( strlen( $password ) < 8 ) {
        return new WP_REST_Response( [ 'error' => 'Password must be at least 8 characters.' ], 400 );
    }

    $affiliate = vp_aff_get_affiliate( $id );
    if ( ! $affiliate ) {
        return new WP_REST_Response( [ 'error' => 'Affiliate not found.' ], 404 );
    }

    $wpdb->update( $wpdb->prefix . 'vp_affiliates', [ 'password_hash' => wp_hash_password( $password ) ], [ 'id' => $id ] );

    return new WP_REST_Response( [ 'success' => true ], 200 );
}

// ── Admin: commissions ───────────────────────────────────────────────────────

function vp_aff_admin_list_commissions( WP_REST_Request $req ): WP_REST_Response {
    global $wpdb;
    $storefront   = $req->get_param( 'storefront' );
    $affiliate_id = $req->get_param( 'affiliate_id' );
    $status       = $req->get_param( 'status' );
    $table        = $wpdb->prefix . 'vp_affiliate_commissions';
    $affTable     = $wpdb->prefix . 'vp_affiliates';

    $where  = [ '1=1' ];
    $params = [];
    if ( $storefront )   { $where[] = 'm.storefront = %s';   $params[] = vp_aff_sanitize_storefront( $storefront ); }
    if ( $affiliate_id ) { $where[] = 'm.affiliate_id = %d'; $params[] = (int) $affiliate_id; }
    if ( $status )        { $where[] = 'm.status = %s';       $params[] = sanitize_text_field( $status ); }

    $sql = "SELECT m.*, a.name AS affiliate_name, a.ref_code
            FROM {$table} m JOIN {$affTable} a ON a.id = m.affiliate_id
            WHERE " . implode( ' AND ', $where ) . " ORDER BY m.created_at DESC LIMIT 200";

    $rows = $params ? $wpdb->get_results( $wpdb->prepare( $sql, $params ) ) : $wpdb->get_results( $sql );

    return new WP_REST_Response( [ 'commissions' => $rows ], 200 );
}

function vp_aff_admin_mark_paid( WP_REST_Request $req ): WP_REST_Response {
    global $wpdb;
    $id    = (int) $req->get_param( 'id' );
    $table = $wpdb->prefix . 'vp_affiliate_commissions';

    $row = $wpdb->get_row( $wpdb->prepare( "SELECT * FROM {$table} WHERE id = %d", $id ) );
    if ( ! $row ) {
        return new WP_REST_Response( [ 'error' => 'Commission not found.' ], 404 );
    }
    if ( $row->status !== 'confirmed' ) {
        return new WP_REST_Response( [ 'error' => "Only 'confirmed' commissions can be marked paid (this one is '{$row->status}')." ], 400 );
    }

    $wpdb->update( $table, [ 'status' => 'paid', 'paid_at' => current_time( 'mysql' ) ], [ 'id' => $id ] );

    return new WP_REST_Response( [ 'success' => true ], 200 );
}

// ─────────────────────────────────────────────────────────────────────────────
// WooCommerce hooks — this is where sales get verified as real
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Order created (any channel, including the REST API used by the Vercel
 * checkout). Attribute a *pending* commission if the order carries an
 * affiliate_ref meta value from the visitor's 30-day cookie.
 */
add_action( 'woocommerce_new_order', 'vp_aff_attribute_order', 10, 1 );
function vp_aff_attribute_order( int $order_id ): void {
    global $wpdb;
    $order = wc_get_order( $order_id );
    if ( ! $order ) return;

    $comm_table = $wpdb->prefix . 'vp_affiliate_commissions';
    $already = $wpdb->get_var( $wpdb->prepare( "SELECT id FROM {$comm_table} WHERE order_id = %d", $order_id ) );
    if ( $already ) return; // idempotent — never double-attribute the same order

    $storefront  = vp_aff_sanitize_storefront( $order->get_meta( 'storefront' ) ?: 'vertalis' );
    $attribution = 'link';
    $affiliate   = null;

    // Primary path: the visitor's 30-day ?ref= cookie, stamped onto the order
    // as meta at checkout.
    $ref_code = $order->get_meta( 'affiliate_ref' );
    if ( $ref_code ) {
        $affiliate = vp_aff_get_affiliate_by_code( strtoupper( $ref_code ) );
    }

    // Fallback: no cookie/link click happened, but the shopper applied one of
    // an affiliate's personal discount coupons at checkout. Coupons are named
    // after the affiliate's own ref_code, so this still earns them a
    // commission even when they only shared "use code X for 10% off."
    if ( ! $affiliate ) {
        foreach ( $order->get_coupon_codes() as $applied_code ) {
            $candidate = vp_aff_get_affiliate_by_coupon( $applied_code );
            if ( $candidate ) {
                $affiliate   = $candidate;
                $attribution = 'coupon';
                break;
            }
        }
    }

    if ( ! $affiliate || $affiliate->status !== 'active' ) return;

    // Fraud guard — an affiliate can't earn commission on their own purchase.
    if ( $affiliate->email && strtolower( $affiliate->email ) === strtolower( $order->get_billing_email() ) ) {
        $order->add_order_note( "VP Affiliates: skipped commission — order email matches affiliate {$affiliate->ref_code} (self-referral)." );
        return;
    }

    $pct    = vp_aff_effective_pct( $affiliate );
    $total  = (float) $order->get_total();
    $amount = round( $total * $pct / 100, 2 );

    $wpdb->insert( $comm_table, [
        'affiliate_id'      => $affiliate->id,
        'order_id'          => $order_id,
        'storefront'        => $storefront,
        'order_total'       => $total,
        'commission_pct'    => $pct,
        'commission_amount' => $amount,
        'status'            => 'pending',
        'attribution'       => $attribution,
    ] );

    $via = $attribution === 'coupon' ? 'coupon code' : 'referral link';
    $order->add_order_note( "VP Affiliates: attributed to {$affiliate->name} ({$affiliate->ref_code}) via {$via} — {$pct}% = \${$amount}, pending until order is completed." );
}

/**
 * Confirmed sale — order reached "Completed" (shipped/delivered). This is the
 * point at which commission becomes payable, matching the ShipStation flow
 * that marks orders completed on shipment confirmation.
 */
add_action( 'woocommerce_order_status_completed', 'vp_aff_confirm_commission', 10, 1 );
function vp_aff_confirm_commission( int $order_id ): void {
    global $wpdb;
    $table = $wpdb->prefix . 'vp_affiliate_commissions';
    $row = $wpdb->get_row( $wpdb->prepare( "SELECT * FROM {$table} WHERE order_id = %d", $order_id ) );
    if ( ! $row || $row->status !== 'pending' ) return;

    $order = wc_get_order( $order_id );
    // Recompute against the final order total in case it changed after creation.
    $total  = $order ? (float) $order->get_total() : (float) $row->order_total;
    $amount = round( $total * (float) $row->commission_pct / 100, 2 );

    $wpdb->update( $table, [
        'order_total'       => $total,
        'commission_amount' => $amount,
        'status'            => 'confirmed',
        'confirmed_at'      => current_time( 'mysql' ),
    ], [ 'id' => $row->id ] );

    if ( $order ) {
        $order->add_order_note( "VP Affiliates: commission confirmed — \${$amount}." );
    }
}

/**
 * Order cancelled / refunded / failed after being attributed. Claw back any
 * commission that hasn't been paid out yet. If it was already paid, leave the
 * record as-is and flag it for manual admin review.
 */
foreach ( [ 'cancelled', 'refunded', 'failed' ] as $vp_aff_status ) {
    add_action( "woocommerce_order_status_{$vp_aff_status}", 'vp_aff_cancel_commission', 10, 1 );
}
function vp_aff_cancel_commission( int $order_id ): void {
    global $wpdb;
    $table = $wpdb->prefix . 'vp_affiliate_commissions';
    $row = $wpdb->get_row( $wpdb->prepare( "SELECT * FROM {$table} WHERE order_id = %d", $order_id ) );
    if ( ! $row ) return;

    $order = wc_get_order( $order_id );

    if ( $row->status === 'paid' ) {
        if ( $order ) {
            $order->add_order_note( "VP Affiliates: order status changed after commission was already PAID (\${$row->commission_amount}) — review for manual clawback." );
        }
        return;
    }
    if ( $row->status === 'cancelled' ) return;

    $wpdb->update( $table, [ 'status' => 'cancelled' ], [ 'id' => $row->id ] );
    if ( $order ) {
        $order->add_order_note( 'VP Affiliates: commission cancelled (order was not completed).' );
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Admin UI — WooCommerce → Affiliates
// ─────────────────────────────────────────────────────────────────────────────

add_action( 'admin_menu', function () {
    add_menu_page( 'Vertalis Affiliates', 'Affiliates', 'manage_woocommerce', 'vp-affiliates', 'vp_aff_admin_page', 'dashicons-groups', 57 );
    add_submenu_page( 'vp-affiliates', 'All Affiliates', 'All Affiliates (all brands)', 'manage_woocommerce', 'vp-affiliates-people', 'vp_aff_render_people_page' );
} );

/**
 * Cross-storefront snapshot — one row per storefront in VPAFF_STOREFRONTS so
 * an admin looking at any single tab can still see at a glance where
 * affiliates and referred sales are coming from site-wide, without having to
 * click through every tab and add the numbers up by hand.
 */
function vp_aff_get_overview_stats(): array {
    global $wpdb;
    $affTable  = $wpdb->prefix . 'vp_affiliates';
    $commTable = $wpdb->prefix . 'vp_affiliate_commissions';
    $clickTable = $wpdb->prefix . 'vp_affiliate_clicks';

    $storefronts = vp_aff_storefront_labels();
    $out = [];
    foreach ( $storefronts as $sf => $label ) {
        $affiliate_count = (int) $wpdb->get_var( $wpdb->prepare(
            "SELECT COUNT(*) FROM {$affTable} WHERE storefront = %s", $sf
        ) );
        $active_count = (int) $wpdb->get_var( $wpdb->prepare(
            "SELECT COUNT(*) FROM {$affTable} WHERE storefront = %s AND status = 'active'", $sf
        ) );
        $clicks_total = (int) $wpdb->get_var( $wpdb->prepare(
            "SELECT COUNT(*) FROM {$clickTable} WHERE storefront = %s", $sf
        ) );
        $sums = $wpdb->get_row( $wpdb->prepare(
            "SELECT
                SUM(CASE WHEN status IN ('confirmed','paid') THEN 1 ELSE 0 END) AS sales_confirmed,
                SUM(CASE WHEN status = 'pending'   THEN commission_amount ELSE 0 END) AS pending_amt,
                SUM(CASE WHEN status = 'confirmed' THEN commission_amount ELSE 0 END) AS confirmed_amt,
                SUM(CASE WHEN status = 'paid'      THEN commission_amount ELSE 0 END) AS paid_amt,
                SUM(CASE WHEN status IN ('confirmed','paid') THEN order_total ELSE 0 END) AS revenue
             FROM {$commTable} WHERE storefront = %s", $sf
        ) );
        $sales_confirmed = (int) ( $sums->sales_confirmed ?? 0 );
        $out[ $sf ] = [
            'label'            => $label,
            'affiliates'       => $affiliate_count,
            'active'           => $active_count,
            'clicks'           => $clicks_total,
            'sales_confirmed'  => $sales_confirmed,
            'conversion_pct'   => $clicks_total > 0 ? round( $sales_confirmed / $clicks_total * 100, 1 ) : 0.0,
            'revenue'          => (float) ( $sums->revenue ?? 0 ),
            'pending_amt'      => (float) ( $sums->pending_amt ?? 0 ),
            'confirmed_amt'    => (float) ( $sums->confirmed_amt ?? 0 ),
            'paid_amt'         => (float) ( $sums->paid_amt ?? 0 ),
        ];
    }
    return $out;
}

/** Streams a CSV of affiliates (current storefront) and exits. */
function vp_aff_export_affiliates_csv( array $affiliates, string $storefront, array $settings ): void {
    nocache_headers();
    header( 'Content-Type: text/csv; charset=utf-8' );
    header( "Content-Disposition: attachment; filename=vp-affiliates-{$storefront}-" . gmdate( 'Y-m-d' ) . '.csv' );

    $out = fopen( 'php://output', 'w' );
    fputcsv( $out, [ 'Storefront', 'Name', 'Email', 'Referral Code', 'Coupon Code', 'Payout Method', 'Payout Destination', 'Commission %', 'Clicks', 'Confirmed Sales', 'Conversion %', 'Pending $', 'Confirmed $', 'Paid $', 'Status', 'Created' ] );
    foreach ( $affiliates as $a ) {
        $clicks = (int) $a->clicks_total;
        $sales  = (int) $a->sales_confirmed;
        fputcsv( $out, [
            $storefront,
            $a->name,
            $a->email,
            $a->ref_code,
            $a->coupon_code,
            $a->payout_method,
            $a->payout_destination,
            $a->commission_pct !== null ? $a->commission_pct : $settings['default_pct'] . ' (default)',
            $clicks,
            $sales,
            $clicks > 0 ? round( $sales / $clicks * 100, 1 ) : 0,
            number_format( (float) $a->pending_amt, 2, '.', '' ),
            number_format( (float) $a->confirmed_amt, 2, '.', '' ),
            number_format( (float) $a->paid_amt, 2, '.', '' ),
            $a->status,
            $a->created_at,
        ] );
    }
    fclose( $out );
    exit;
}

/** Streams a CSV of the commission/referral log (current storefront + filters) and exits. */
function vp_aff_export_commissions_csv( array $commissions, string $storefront ): void {
    nocache_headers();
    header( 'Content-Type: text/csv; charset=utf-8' );
    header( "Content-Disposition: attachment; filename=vp-commissions-{$storefront}-" . gmdate( 'Y-m-d' ) . '.csv' );

    $out = fopen( 'php://output', 'w' );
    fputcsv( $out, [ 'Storefront', 'Order ID', 'Affiliate', 'Referral Code', 'Order Total', 'Commission %', 'Commission $', 'Status', 'Date' ] );
    foreach ( $commissions as $c ) {
        fputcsv( $out, [
            $storefront,
            $c->order_id,
            $c->affiliate_name,
            $c->ref_code,
            number_format( (float) $c->order_total, 2, '.', '' ),
            $c->commission_pct,
            number_format( (float) $c->commission_amount, 2, '.', '' ),
            $c->status,
            $c->created_at,
        ] );
    }
    fclose( $out );
    exit;
}

function vp_aff_admin_page(): void {
    if ( ! current_user_can( 'manage_woocommerce' ) ) return;

    global $wpdb;
    $storefronts = vp_aff_storefront_labels();
    $active_sf   = vp_aff_sanitize_storefront( $_GET['storefront'] ?? 'vertalis' );
    $notice      = '';

    $affTable   = $wpdb->prefix . 'vp_affiliates';
    $commTable  = $wpdb->prefix . 'vp_affiliate_commissions';
    $clickTable = $wpdb->prefix . 'vp_affiliate_clicks';

    // ── Handle POSTs (classic full-page-reload admin forms, same pattern as VP P2P) ──

    if ( isset( $_POST['vp_aff_save_settings'] ) ) {
        check_admin_referer( 'vp_aff_settings' );
        $chosen_methods = array_intersect(
            array_map( 'sanitize_key', (array) ( $_POST['payout_methods'] ?? [] ) ),
            array_keys( vp_aff_payout_methods() )
        );
        update_option( "vp_aff_settings_{$active_sf}", [
            'default_pct'               => (float) ( $_POST['default_pct'] ?? 10 ),
            'discount_pct'              => (float) ( $_POST['discount_pct'] ?? 10 ),
            'cookie_days'               => (int) ( $_POST['cookie_days'] ?? 30 ),
            'min_payout'                => (float) ( $_POST['min_payout'] ?? 25 ),
            'payout_methods'            => $chosen_methods ?: array_keys( vp_aff_payout_methods() ),
            'allow_affiliate_materials' => ! empty( $_POST['allow_affiliate_materials'] ),
        ] );
        $notice = 'Settings saved.';
    }

    if ( isset( $_POST['vp_aff_create'] ) ) {
        check_admin_referer( 'vp_aff_create' );
        $name     = sanitize_text_field( $_POST['name'] ?? '' );
        $email    = sanitize_email( $_POST['email'] ?? '' );
        $password = (string) ( $_POST['password'] ?? '' );
        $pctRaw   = $_POST['commission_pct'] ?? '';
        $pct      = $pctRaw === '' ? null : (float) $pctRaw;

        if ( ! $name || ! is_email( $email ) || strlen( $password ) < 8 ) {
            $notice = 'ERROR: name, valid email, and an 8+ character password are required.';
        } elseif ( $wpdb->get_var( $wpdb->prepare( "SELECT id FROM {$affTable} WHERE email = %s AND storefront = %s", $email, $active_sf ) ) ) {
            $notice = 'ERROR: an affiliate with that email already exists on this storefront. To add them to another brand too, use All Affiliates instead.';
        } else {
            $ref_code = vp_aff_generate_ref_code( $name );
            $wpdb->insert( $affTable, [
                'name' => $name, 'email' => $email, 'password_hash' => wp_hash_password( $password ),
                'ref_code' => $ref_code, 'storefront' => $active_sf, 'commission_pct' => $pct, 'status' => 'active',
            ] );
            $notice = "Affiliate created — referral code {$ref_code}. Share the login + password with them directly.";
        }
    }

    if ( isset( $_POST['vp_aff_update'] ) ) {
        check_admin_referer( 'vp_aff_update' );
        $id  = (int) $_POST['affiliate_id'];
        $was = vp_aff_get_affiliate( $id );
        $update = [
            'status'         => in_array( $_POST['status'] ?? '', [ 'active', 'disabled', 'pending' ], true ) ? $_POST['status'] : 'active',
            'commission_pct' => ( $_POST['commission_pct'] ?? '' ) === '' ? null : (float) $_POST['commission_pct'],
        ];
        $wpdb->update( $affTable, $update, [ 'id' => $id ] );
        if ( $update['status'] === 'active' && $was && $was->status !== 'active' ) {
            vp_aff_ensure_coupon( $id ); // approving a pending signup, or reactivating — make sure their coupon exists
        }
        $notice = 'Affiliate updated.';
    }

    if ( isset( $_POST['vp_aff_reset_password'] ) ) {
        check_admin_referer( 'vp_aff_reset_password' );
        $id = (int) $_POST['affiliate_id'];
        $password = (string) ( $_POST['new_password'] ?? '' );
        if ( strlen( $password ) < 8 ) {
            $notice = 'ERROR: password must be at least 8 characters.';
        } else {
            $wpdb->update( $affTable, [ 'password_hash' => wp_hash_password( $password ) ], [ 'id' => $id ] );
            $notice = 'Password reset.';
        }
    }

    if ( isset( $_POST['vp_aff_mark_paid'] ) ) {
        check_admin_referer( 'vp_aff_mark_paid' );
        $id  = (int) $_POST['commission_id'];
        $row = $wpdb->get_row( $wpdb->prepare( "SELECT * FROM {$commTable} WHERE id = %d", $id ) );
        if ( $row && $row->status === 'confirmed' ) {
            $wpdb->update( $commTable, [ 'status' => 'paid', 'paid_at' => current_time( 'mysql' ) ], [ 'id' => $id ] );
            $notice = 'Commission marked as paid.';
        }
    }

    $payoutTable   = $wpdb->prefix . 'vp_affiliate_payouts';
    $materialTable = $wpdb->prefix . 'vp_affiliate_materials';

    if ( isset( $_POST['vp_aff_mark_payout_paid'] ) ) {
        check_admin_referer( 'vp_aff_mark_payout_paid' );
        $id  = (int) $_POST['payout_id'];
        $row = $wpdb->get_row( $wpdb->prepare( "SELECT * FROM {$payoutTable} WHERE id = %d", $id ) );
        if ( $row && $row->status === 'requested' ) {
            $wpdb->update( $payoutTable, [ 'status' => 'paid', 'paid_at' => current_time( 'mysql' ) ], [ 'id' => $id ] );
            $wpdb->query( $wpdb->prepare(
                "UPDATE {$commTable} SET status = 'paid', paid_at = %s WHERE affiliate_id = %d AND status = 'confirmed' ORDER BY created_at ASC LIMIT 1000",
                current_time( 'mysql' ), $row->affiliate_id
            ) );
            $notice = 'Payout marked as paid.';
        }
    }

    if ( isset( $_POST['vp_aff_add_material'] ) ) {
        check_admin_referer( 'vp_aff_add_material' );
        $title   = sanitize_text_field( $_POST['material_title'] ?? '' );
        $type    = in_array( $_POST['material_type'] ?? '', [ 'image', 'text', 'link' ], true ) ? $_POST['material_type'] : 'text';
        $content = wp_kses_post( $_POST['material_content'] ?? '' );
        if ( ! $title || ! $content ) {
            $notice = 'ERROR: material title and content are required.';
        } else {
            $wpdb->insert( $materialTable, [
                'storefront'   => $active_sf,
                'type'         => $type,
                'title'        => $title,
                'content'      => $content,
                'affiliate_id' => null,
                'status'       => 'approved',
            ] );
            $notice = 'Marketing material added.';
        }
    }

    if ( isset( $_POST['vp_aff_approve_material'] ) ) {
        check_admin_referer( 'vp_aff_approve_material' );
        $wpdb->update( $materialTable, [ 'status' => 'approved' ], [ 'id' => (int) $_POST['material_id'] ] );
        $notice = 'Material approved — now visible in the affiliate portal.';
    }

    if ( isset( $_POST['vp_aff_delete_material'] ) ) {
        check_admin_referer( 'vp_aff_delete_material' );
        $wpdb->delete( $materialTable, [ 'id' => (int) $_POST['material_id'] ] );
        $notice = 'Marketing material deleted.';
    }

    $settings = vp_aff_get_settings( $active_sf );

    $affiliates = $wpdb->get_results( $wpdb->prepare(
        "SELECT a.*,
            (SELECT COUNT(*) FROM {$clickTable} c WHERE c.affiliate_id = a.id) AS clicks_total,
            (SELECT SUM(CASE WHEN status IN ('confirmed','paid') THEN 1 ELSE 0 END) FROM {$commTable} m WHERE m.affiliate_id = a.id) AS sales_confirmed,
            (SELECT SUM(CASE WHEN status = 'pending' THEN commission_amount ELSE 0 END) FROM {$commTable} m WHERE m.affiliate_id = a.id) AS pending_amt,
            (SELECT SUM(CASE WHEN status = 'confirmed' THEN commission_amount ELSE 0 END) FROM {$commTable} m WHERE m.affiliate_id = a.id) AS confirmed_amt,
            (SELECT SUM(CASE WHEN status = 'paid' THEN commission_amount ELSE 0 END) FROM {$commTable} m WHERE m.affiliate_id = a.id) AS paid_amt
         FROM {$affTable} a WHERE a.storefront = %s ORDER BY a.created_at DESC", $active_sf
    ) );

    $pending_affiliates = array_values( array_filter( $affiliates, fn( $a ) => $a->status === 'pending' ) );

    $payout_requests = $wpdb->get_results( $wpdb->prepare(
        "SELECT p.*, a.name AS affiliate_name, a.ref_code, a.email
         FROM {$payoutTable} p JOIN {$affTable} a ON a.id = p.affiliate_id
         WHERE p.storefront = %s ORDER BY FIELD(p.status,'requested','paid') , p.requested_at DESC LIMIT 100", $active_sf
    ) );

    $materials = $wpdb->get_results( $wpdb->prepare(
        "SELECT m.*, a.name AS affiliate_name
         FROM {$materialTable} m LEFT JOIN {$affTable} a ON a.id = m.affiliate_id
         WHERE m.storefront = %s ORDER BY FIELD(m.status,'pending','approved'), m.created_at DESC", $active_sf
    ) );
    $pending_materials = array_values( array_filter( $materials, fn( $m ) => $m->status === 'pending' ) );

    // ── Referral log filters (status + date range) — GET params, no page reload logic needed ──
    $log_status = isset( $_GET['log_status'] ) ? sanitize_key( $_GET['log_status'] ) : '';
    $log_days   = isset( $_GET['log_days'] ) ? (int) $_GET['log_days'] : 0;

    $log_where  = [ 'm.storefront = %s' ];
    $log_params = [ $active_sf ];
    if ( $log_status && in_array( $log_status, [ 'pending', 'confirmed', 'paid', 'cancelled' ], true ) ) {
        $log_where[]  = 'm.status = %s';
        $log_params[] = $log_status;
    }
    if ( $log_days > 0 ) {
        $log_where[]  = 'm.created_at >= DATE_SUB(NOW(), INTERVAL %d DAY)';
        $log_params[] = $log_days;
    }

    $commissions = $wpdb->get_results( $wpdb->prepare(
        "SELECT m.*, a.name AS affiliate_name, a.ref_code
         FROM {$commTable} m JOIN {$affTable} a ON a.id = m.affiliate_id
         WHERE " . implode( ' AND ', $log_where ) . " ORDER BY m.created_at DESC LIMIT 300",
        $log_params
    ) );

    // ── CSV export — checked after the data above is fetched so it reflects
    //    the same filters as what's on screen. Exits immediately, no HTML sent. ──
    if ( isset( $_GET['vp_aff_export'] ) && current_user_can( 'manage_woocommerce' ) ) {
        if ( $_GET['vp_aff_export'] === 'affiliates' ) {
            vp_aff_export_affiliates_csv( $affiliates, $active_sf, $settings );
        } elseif ( $_GET['vp_aff_export'] === 'commissions' ) {
            vp_aff_export_commissions_csv( $commissions, $active_sf );
        }
    }

    $overview = vp_aff_get_overview_stats();

    // Totals for the current storefront's affiliate table — quick glance, no manual adding up.
    $totals = [ 'clicks' => 0, 'sales' => 0, 'pending' => 0.0, 'confirmed' => 0.0, 'paid' => 0.0 ];
    foreach ( $affiliates as $a ) {
        $totals['clicks']    += (int) $a->clicks_total;
        $totals['sales']     += (int) $a->sales_confirmed;
        $totals['pending']   += (float) $a->pending_amt;
        $totals['confirmed'] += (float) $a->confirmed_amt;
        $totals['paid']      += (float) $a->paid_amt;
    }

    // Top affiliates leaderboard (confirmed + paid commission $, this storefront).
    $leaderboard = $affiliates;
    usort( $leaderboard, fn( $a, $b ) => ( (float) $b->confirmed_amt + (float) $b->paid_amt ) <=> ( (float) $a->confirmed_amt + (float) $a->paid_amt ) );
    $leaderboard = array_slice( $leaderboard, 0, 5 );

    $site_url = untrailingslashit( home_url() );
    ?>
    <div class="wrap">
        <h1>VP Affiliates</h1>
        <?php if ( $notice ) : $err = str_starts_with( $notice, 'ERROR' ); ?>
            <div class="notice <?php echo $err ? 'notice-error' : 'notice-success'; ?>"><p><?php echo esc_html( $notice ); ?></p></div>
        <?php endif; ?>

        <h2 style="margin-top:0;">All Storefronts — Overview</h2>
        <p class="description">Where affiliates and referred sales are coming from, across every storefront on this WordPress install.</p>
        <table class="widefat striped" style="max-width:900px;margin-bottom:24px;">
            <thead>
                <tr>
                    <th>Storefront</th>
                    <th>Affiliates</th>
                    <th>Clicks</th>
                    <th>Confirmed Sales</th>
                    <th>Conversion</th>
                    <th>Referred Revenue</th>
                    <th>Pending $</th>
                    <th>Confirmed $</th>
                    <th>Paid $</th>
                </tr>
            </thead>
            <tbody>
                <?php foreach ( $overview as $sf => $o ) : ?>
                    <tr<?php echo $sf === $active_sf ? ' style="background:#fef9e7;font-weight:600;"' : ''; ?>>
                        <td>
                            <a href="<?php echo esc_url( admin_url( "admin.php?page=vp-affiliates&storefront={$sf}" ) ); ?>">
                                <?php echo esc_html( $o['label'] ); ?>
                            </a>
                        </td>
                        <td><?php echo (int) $o['affiliates']; ?> (<?php echo (int) $o['active']; ?> active)</td>
                        <td><?php echo (int) $o['clicks']; ?></td>
                        <td><?php echo (int) $o['sales_confirmed']; ?></td>
                        <td><?php echo esc_html( $o['conversion_pct'] ); ?>%</td>
                        <td>$<?php echo number_format( $o['revenue'], 2 ); ?></td>
                        <td>$<?php echo number_format( $o['pending_amt'], 2 ); ?></td>
                        <td>$<?php echo number_format( $o['confirmed_amt'], 2 ); ?></td>
                        <td>$<?php echo number_format( $o['paid_amt'], 2 ); ?></td>
                    </tr>
                <?php endforeach; ?>
            </tbody>
        </table>

        <nav class="nav-tab-wrapper" style="margin-bottom:20px">
            <?php foreach ( $storefronts as $sf => $label ) :
                $url = admin_url( "admin.php?page=vp-affiliates&storefront={$sf}" );
                $cls = $sf === $active_sf ? 'nav-tab nav-tab-active' : 'nav-tab';
                ?>
                <a href="<?php echo esc_url( $url ); ?>" class="<?php echo $cls; ?>"><?php echo esc_html( $label ); ?></a>
            <?php endforeach; ?>
            <a href="<?php echo esc_url( admin_url( 'admin.php?page=vp-affiliates-people' ) ); ?>" class="nav-tab" style="margin-left:8px">All Affiliates (all brands) →</a>
        </nav>

        <h2>Settings — <?php echo esc_html( $storefronts[ $active_sf ] ); ?></h2>
        <form method="post" style="margin-bottom:30px">
            <?php wp_nonce_field( 'vp_aff_settings' ); ?>
            <table class="form-table">
                <tr>
                    <th><label>Default commission %</label></th>
                    <td>
                        <input type="number" step="0.01" min="0" max="100" name="default_pct" value="<?php echo esc_attr( $settings['default_pct'] ); ?>" class="small-text" />
                        <p class="description">Applied to any affiliate without their own commission % override.</p>
                    </td>
                </tr>
                <tr>
                    <th><label>Cookie attribution window (days)</label></th>
                    <td>
                        <input type="number" min="1" name="cookie_days" value="<?php echo esc_attr( $settings['cookie_days'] ); ?>" class="small-text" />
                        <p class="description">Reference only — the frontend cookie is fixed at 30 days per the affiliate program policy. Change this only if the frontend is updated to match.</p>
                    </td>
                </tr>
                <tr>
                    <th><label>Personal coupon discount %</label></th>
                    <td>
                        <input type="number" step="0.01" min="0" max="100" name="discount_pct" value="<?php echo esc_attr( $settings['discount_pct'] ); ?>" class="small-text" />
                        <p class="description">Discount a shopper gets when they use an affiliate's personal coupon code (their referral code). The affiliate still earns commission on the discounted total.</p>
                    </td>
                </tr>
                <tr>
                    <th><label>Minimum payout ($)</label></th>
                    <td>
                        <input type="number" step="0.01" min="0" name="min_payout" value="<?php echo esc_attr( $settings['min_payout'] ); ?>" class="small-text" />
                        <p class="description">Smallest confirmed balance an affiliate is allowed to request a withdrawal for.</p>
                    </td>
                </tr>
                <tr>
                    <th><label>Payout methods</label></th>
                    <td>
                        <?php foreach ( vp_aff_payout_methods() as $method_key => $method_label ) : ?>
                            <label style="display:inline-block;margin-right:16px;">
                                <input type="checkbox" name="payout_methods[]" value="<?php echo esc_attr( $method_key ); ?>" <?php checked( in_array( $method_key, $settings['payout_methods'], true ) ); ?> />
                                <?php echo esc_html( $method_label ); ?>
                            </label>
                        <?php endforeach; ?>
                        <p class="description">Which withdrawal methods affiliates on <?php echo esc_html( $storefronts[ $active_sf ] ); ?> can choose from. Leaving all unchecked allows all methods (an affiliate always needs at least one option).</p>
                    </td>
                </tr>
                <tr>
                    <th><label>Affiliate-submitted materials</label></th>
                    <td>
                        <label>
                            <input type="checkbox" name="allow_affiliate_materials" value="1" <?php checked( ! empty( $settings['allow_affiliate_materials'] ) ); ?> />
                            Allow affiliates to submit their own marketing materials
                        </label>
                        <p class="description">When enabled, affiliates on this storefront can submit banners/copy/links from their portal. Submissions are queued below for your approval before they appear publicly — admin-added materials are still published immediately.</p>
                    </td>
                </tr>
            </table>
            <p><input type="submit" name="vp_aff_save_settings" class="button-primary" value="Save Settings" /></p>
        </form>

        <hr>

        <h2>Add Affiliate</h2>
        <p class="description">Accounts are created here only — there is no public signup form. Share the login email/password with the affiliate directly.</p>
        <form method="post" style="margin-bottom:30px">
            <?php wp_nonce_field( 'vp_aff_create' ); ?>
            <table class="form-table">
                <tr><th><label>Name</label></th><td><input type="text" name="name" class="regular-text" required /></td></tr>
                <tr><th><label>Email (their login)</label></th><td><input type="email" name="email" class="regular-text" required /></td></tr>
                <tr><th><label>Password</label></th><td><input type="text" name="password" class="regular-text" required placeholder="min. 8 characters" /></td></tr>
                <tr>
                    <th><label>Commission % override</label></th>
                    <td><input type="number" step="0.01" min="0" max="100" name="commission_pct" class="small-text" placeholder="default" /> <span class="description">leave blank to use the default above</span></td>
                </tr>
            </table>
            <p><input type="submit" name="vp_aff_create" class="button-primary" value="Create Affiliate" /></p>
        </form>

        <hr>

        <?php if ( $pending_affiliates ) : ?>
        <h2>Pending Approval — <?php echo esc_html( $storefronts[ $active_sf ] ); ?> (<?php echo count( $pending_affiliates ); ?>)</h2>
        <p class="description">Self-registered signups awaiting review. Approving activates their account and creates their personal discount coupon; rejecting disables the account (email stays reserved so they can't just re-register).</p>
        <table class="widefat striped" style="max-width:800px;margin-bottom:24px;">
            <thead><tr><th>Name / Email</th><th>Referral Code</th><th>Signed up</th><th>Actions</th></tr></thead>
            <tbody>
                <?php foreach ( $pending_affiliates as $a ) : ?>
                    <tr>
                        <td><strong><?php echo esc_html( $a->name ); ?></strong><br><span class="description"><?php echo esc_html( $a->email ); ?></span></td>
                        <td><code><?php echo esc_html( $a->ref_code ); ?></code></td>
                        <td><?php echo esc_html( $a->created_at ); ?></td>
                        <td>
                            <form method="post" style="display:inline-block;margin-right:6px;">
                                <?php wp_nonce_field( 'vp_aff_update' ); ?>
                                <input type="hidden" name="affiliate_id" value="<?php echo (int) $a->id; ?>" />
                                <input type="hidden" name="status" value="active" />
                                <button type="submit" name="vp_aff_update" class="button button-primary button-small">Approve</button>
                            </form>
                            <form method="post" style="display:inline-block;">
                                <?php wp_nonce_field( 'vp_aff_update' ); ?>
                                <input type="hidden" name="affiliate_id" value="<?php echo (int) $a->id; ?>" />
                                <input type="hidden" name="status" value="disabled" />
                                <button type="submit" name="vp_aff_update" class="button button-small">Reject</button>
                            </form>
                        </td>
                    </tr>
                <?php endforeach; ?>
            </tbody>
        </table>
        <hr>
        <?php endif; ?>

        <?php if ( $leaderboard ) : ?>
        <h2>Top Affiliates — <?php echo esc_html( $storefronts[ $active_sf ] ); ?></h2>
        <p class="description">Ranked by confirmed + paid commission earned. Quick way to see who's actually driving sales for this storefront.</p>
        <table class="widefat striped" style="max-width:700px;margin-bottom:24px;">
            <thead><tr><th>#</th><th>Affiliate</th><th>Confirmed Sales</th><th>Conversion</th><th>Earned (confirmed + paid)</th></tr></thead>
            <tbody>
                <?php foreach ( $leaderboard as $i => $a ) :
                    $clicks = (int) $a->clicks_total;
                    $sales  = (int) $a->sales_confirmed;
                    $earned = (float) $a->confirmed_amt + (float) $a->paid_amt;
                    if ( $earned <= 0 && $sales <= 0 ) continue;
                    ?>
                    <tr>
                        <td><?php echo (int) $i + 1; ?></td>
                        <td><?php echo esc_html( $a->name ); ?> <span class="description">(<?php echo esc_html( $a->ref_code ); ?>)</span></td>
                        <td><?php echo $sales; ?></td>
                        <td><?php echo $clicks > 0 ? round( $sales / $clicks * 100, 1 ) : 0; ?>%</td>
                        <td>$<?php echo number_format( $earned, 2 ); ?></td>
                    </tr>
                <?php endforeach; ?>
            </tbody>
        </table>
        <?php endif; ?>

        <h2>
            Affiliates — <?php echo esc_html( $storefronts[ $active_sf ] ); ?> (<?php echo count( $affiliates ); ?>)
            <a href="<?php echo esc_url( add_query_arg( 'vp_aff_export', 'affiliates' ) ); ?>" class="page-title-action">Export CSV</a>
        </h2>
        <table class="widefat striped">
            <thead>
                <tr>
                    <th>Name / Email</th>
                    <th>Referral Link</th>
                    <th>Coupon</th>
                    <th>Payout Info</th>
                    <th>Commission %</th>
                    <th>Clicks</th>
                    <th>Confirmed Sales</th>
                    <th>Conversion</th>
                    <th>Pending $</th>
                    <th>Confirmed $</th>
                    <th>Paid $</th>
                    <th>Status</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                <?php if ( ! $affiliates ) : ?>
                    <tr><td colspan="13">No affiliates yet for this storefront.</td></tr>
                <?php endif; ?>
                <?php foreach ( $affiliates as $a ) :
                    $link = "{$site_url}/?ref=" . rawurlencode( $a->ref_code );
                    $clicks = (int) $a->clicks_total;
                    $sales  = (int) $a->sales_confirmed;
                    $conv   = $clicks > 0 ? round( $sales / $clicks * 100, 1 ) : 0;
                    ?>
                    <tr>
                        <td><strong><?php echo esc_html( $a->name ); ?></strong><br><span class="description"><?php echo esc_html( $a->email ); ?></span></td>
                        <td><code style="font-size:11px"><?php echo esc_html( $link ); ?></code></td>
                        <td><?php echo $a->coupon_code ? '<code>' . esc_html( $a->coupon_code ) . '</code>' : '<span class="description">—</span>'; ?></td>
                        <td>
                            <?php if ( $a->payout_method ) : ?>
                                <?php echo esc_html( vp_aff_payout_methods()[ $a->payout_method ] ?? $a->payout_method ); ?><br>
                                <span class="description"><?php echo esc_html( $a->payout_destination ); ?></span>
                            <?php else : ?>
                                <span class="description">not set</span>
                            <?php endif; ?>
                        </td>
                        <td><?php echo esc_html( $a->commission_pct !== null ? $a->commission_pct . '%' : $settings['default_pct'] . '% (default)' ); ?></td>
                        <td><?php echo $clicks; ?></td>
                        <td><?php echo $sales; ?></td>
                        <td><?php echo esc_html( $conv ); ?>%</td>
                        <td>$<?php echo number_format( (float) $a->pending_amt, 2 ); ?></td>
                        <td>$<?php echo number_format( (float) $a->confirmed_amt, 2 ); ?></td>
                        <td>$<?php echo number_format( (float) $a->paid_amt, 2 ); ?></td>
                        <td>
                            <span style="padding:2px 8px;border-radius:3px;font-size:11px;<?php
                                echo match ( $a->status ) {
                                    'active'  => 'background:#d4edda;color:#155724',
                                    'pending' => 'background:#fff3cd;color:#856404',
                                    default   => 'background:#f8d7da;color:#721c24',
                                };
                            ?>">
                                <?php echo esc_html( strtoupper( $a->status ) ); ?>
                            </span>
                        </td>
                        <td>
                            <details>
                                <summary style="cursor:pointer">Edit</summary>
                                <form method="post" style="margin-top:8px">
                                    <?php wp_nonce_field( 'vp_aff_update' ); ?>
                                    <input type="hidden" name="affiliate_id" value="<?php echo (int) $a->id; ?>" />
                                    <label>Status:
                                        <select name="status">
                                            <option value="active" <?php selected( $a->status, 'active' ); ?>>Active</option>
                                            <option value="pending" <?php selected( $a->status, 'pending' ); ?>>Pending</option>
                                            <option value="disabled" <?php selected( $a->status, 'disabled' ); ?>>Disabled</option>
                                        </select>
                                    </label><br>
                                    <label>Commission % override:
                                        <input type="number" step="0.01" min="0" max="100" name="commission_pct" value="<?php echo esc_attr( $a->commission_pct ?? '' ); ?>" class="small-text" placeholder="default" />
                                    </label><br>
                                    <button type="submit" name="vp_aff_update" class="button">Save</button>
                                </form>
                                <form method="post" style="margin-top:8px">
                                    <?php wp_nonce_field( 'vp_aff_reset_password' ); ?>
                                    <input type="hidden" name="affiliate_id" value="<?php echo (int) $a->id; ?>" />
                                    <label>New password: <input type="text" name="new_password" class="small-text" /></label>
                                    <button type="submit" name="vp_aff_reset_password" class="button">Reset Password</button>
                                </form>
                            </details>
                        </td>
                    </tr>
                <?php endforeach; ?>
            </tbody>
            <?php if ( $affiliates ) : ?>
            <tfoot>
                <tr style="font-weight:600;background:#f6f7f7;">
                    <td colspan="5">Totals</td>
                    <td><?php echo (int) $totals['clicks']; ?></td>
                    <td><?php echo (int) $totals['sales']; ?></td>
                    <td><?php echo $totals['clicks'] > 0 ? round( $totals['sales'] / $totals['clicks'] * 100, 1 ) : 0; ?>%</td>
                    <td>$<?php echo number_format( $totals['pending'], 2 ); ?></td>
                    <td>$<?php echo number_format( $totals['confirmed'], 2 ); ?></td>
                    <td>$<?php echo number_format( $totals['paid'], 2 ); ?></td>
                    <td colspan="2"></td>
                </tr>
            </tfoot>
            <?php endif; ?>
        </table>

        <hr>

        <h2>
            Referral / Commission Log — <?php echo esc_html( $storefronts[ $active_sf ] ); ?>
            <a href="<?php echo esc_url( add_query_arg( 'vp_aff_export', 'commissions' ) ); ?>" class="page-title-action">Export CSV</a>
        </h2>

        <form method="get" style="margin-bottom:12px;">
            <input type="hidden" name="page" value="vp-affiliates" />
            <input type="hidden" name="storefront" value="<?php echo esc_attr( $active_sf ); ?>" />
            <label>Status:
                <select name="log_status">
                    <option value="">All</option>
                    <?php foreach ( [ 'pending', 'confirmed', 'paid', 'cancelled' ] as $s ) : ?>
                        <option value="<?php echo esc_attr( $s ); ?>" <?php selected( $log_status, $s ); ?>><?php echo esc_html( ucfirst( $s ) ); ?></option>
                    <?php endforeach; ?>
                </select>
            </label>
            <label style="margin-left:10px;">Since:
                <select name="log_days">
                    <option value="0" <?php selected( $log_days, 0 ); ?>>All time</option>
                    <option value="7" <?php selected( $log_days, 7 ); ?>>Last 7 days</option>
                    <option value="30" <?php selected( $log_days, 30 ); ?>>Last 30 days</option>
                    <option value="90" <?php selected( $log_days, 90 ); ?>>Last 90 days</option>
                    <option value="365" <?php selected( $log_days, 365 ); ?>>Last 12 months</option>
                </select>
            </label>
            <button type="submit" class="button" style="margin-left:10px;">Filter</button>
            <?php if ( $log_status || $log_days ) : ?>
                <a href="<?php echo esc_url( admin_url( "admin.php?page=vp-affiliates&storefront={$active_sf}" ) ); ?>" class="button-link" style="margin-left:8px;">Clear</a>
            <?php endif; ?>
        </form>

        <table class="widefat striped">
            <thead>
                <tr><th>Order</th><th>Affiliate</th><th>Via</th><th>Order Total</th><th>%</th><th>Commission</th><th>Status</th><th>Date</th><th></th></tr>
            </thead>
            <tbody>
                <?php if ( ! $commissions ) : ?>
                    <tr><td colspan="9">No referred orders match this filter.</td></tr>
                <?php endif; ?>
                <?php
                $log_totals = [ 'order_total' => 0.0, 'commission' => 0.0 ];
                foreach ( $commissions as $c ) :
                    $log_totals['order_total'] += (float) $c->order_total;
                    $log_totals['commission']  += (float) $c->commission_amount;
                    $order_edit = admin_url( 'admin.php?page=wc-orders&action=edit&id=' . (int) $c->order_id );
                    $badge = match ( $c->status ) {
                        'confirmed' => 'background:#d4edda;color:#155724',
                        'paid'      => 'background:#cce5ff;color:#004085',
                        'cancelled' => 'background:#f8d7da;color:#721c24',
                        default     => 'background:#fff3cd;color:#856404',
                    };
                    ?>
                    <tr>
                        <td><a href="<?php echo esc_url( $order_edit ); ?>">#<?php echo (int) $c->order_id; ?></a></td>
                        <td><?php echo esc_html( $c->affiliate_name ); ?> (<?php echo esc_html( $c->ref_code ); ?>)</td>
                        <td><span class="description"><?php echo esc_html( ( $c->attribution ?? 'link' ) === 'coupon' ? 'Coupon' : 'Link' ); ?></span></td>
                        <td>$<?php echo number_format( (float) $c->order_total, 2 ); ?></td>
                        <td><?php echo esc_html( $c->commission_pct ); ?>%</td>
                        <td>$<?php echo number_format( (float) $c->commission_amount, 2 ); ?></td>
                        <td><span style="padding:2px 8px;border-radius:3px;font-size:11px;<?php echo $badge; ?>"><?php echo esc_html( strtoupper( $c->status ) ); ?></span></td>
                        <td><?php echo esc_html( $c->created_at ); ?></td>
                        <td>
                            <?php if ( $c->status === 'confirmed' ) : ?>
                                <form method="post">
                                    <?php wp_nonce_field( 'vp_aff_mark_paid' ); ?>
                                    <input type="hidden" name="commission_id" value="<?php echo (int) $c->id; ?>" />
                                    <button type="submit" name="vp_aff_mark_paid" class="button button-small">Mark Paid</button>
                                </form>
                            <?php endif; ?>
                        </td>
                    </tr>
                <?php endforeach; ?>
            </tbody>
            <?php if ( $commissions ) : ?>
            <tfoot>
                <tr style="font-weight:600;background:#f6f7f7;">
                    <td colspan="3">Totals (<?php echo count( $commissions ); ?> orders<?php echo count( $commissions ) >= 300 ? ', capped at 300 most recent' : ''; ?>)</td>
                    <td>$<?php echo number_format( $log_totals['order_total'], 2 ); ?></td>
                    <td></td>
                    <td>$<?php echo number_format( $log_totals['commission'], 2 ); ?></td>
                    <td colspan="3"></td>
                </tr>
            </tfoot>
            <?php endif; ?>
        </table>

        <hr>

        <h2>Payout Requests — <?php echo esc_html( $storefronts[ $active_sf ] ); ?></h2>
        <p class="description">Affiliates request a withdrawal once their confirmed balance clears the minimum payout. Send the money via the method/destination shown, then mark it paid — this also flips the underlying confirmed commissions to "paid".</p>
        <table class="widefat striped" style="max-width:900px;margin-bottom:24px;">
            <thead><tr><th>Affiliate</th><th>Amount</th><th>Method</th><th>Destination</th><th>Status</th><th>Requested</th><th></th></tr></thead>
            <tbody>
                <?php if ( ! $payout_requests ) : ?>
                    <tr><td colspan="7">No payout requests yet for this storefront.</td></tr>
                <?php endif; ?>
                <?php foreach ( $payout_requests as $p ) :
                    $pbadge = $p->status === 'paid' ? 'background:#cce5ff;color:#004085' : 'background:#fff3cd;color:#856404';
                    ?>
                    <tr>
                        <td><?php echo esc_html( $p->affiliate_name ); ?> (<?php echo esc_html( $p->ref_code ); ?>)</td>
                        <td>$<?php echo number_format( (float) $p->amount, 2 ); ?></td>
                        <td><?php echo esc_html( vp_aff_payout_methods()[ $p->method ] ?? $p->method ); ?></td>
                        <td><code style="font-size:11px"><?php echo esc_html( $p->destination ); ?></code></td>
                        <td><span style="padding:2px 8px;border-radius:3px;font-size:11px;<?php echo $pbadge; ?>"><?php echo esc_html( strtoupper( $p->status ) ); ?></span></td>
                        <td><?php echo esc_html( $p->requested_at ); ?></td>
                        <td>
                            <?php if ( $p->status === 'requested' ) : ?>
                                <form method="post">
                                    <?php wp_nonce_field( 'vp_aff_mark_payout_paid' ); ?>
                                    <input type="hidden" name="payout_id" value="<?php echo (int) $p->id; ?>" />
                                    <button type="submit" name="vp_aff_mark_payout_paid" class="button button-small">Mark Paid</button>
                                </form>
                            <?php endif; ?>
                        </td>
                    </tr>
                <?php endforeach; ?>
            </tbody>
        </table>

        <hr>

        <h2>
            Marketing Materials — <?php echo esc_html( $storefronts[ $active_sf ] ); ?>
            <?php if ( $pending_materials ) : ?>
                <span style="padding:2px 8px;border-radius:3px;font-size:11px;background:#fff3cd;color:#856404;">
                    <?php echo count( $pending_materials ); ?> pending review
                </span>
            <?php endif; ?>
        </h2>
        <p class="description">Banners, swipe copy, and links affiliates can grab from their portal's Materials page. "Image" items should have their content set to a public image URL; "Link" items to a URL; "Text" items are shown as-is (e.g. sample social captions). Materials added here publish immediately; materials affiliates submit themselves (when enabled in Settings above) land as "Pending" until approved below.</p>

        <form method="post" style="margin-bottom:20px;max-width:600px;">
            <?php wp_nonce_field( 'vp_aff_add_material' ); ?>
            <table class="form-table">
                <tr><th><label>Title</label></th><td><input type="text" name="material_title" class="regular-text" required /></td></tr>
                <tr>
                    <th><label>Type</label></th>
                    <td>
                        <select name="material_type">
                            <option value="text">Text (e.g. sample caption)</option>
                            <option value="image">Image URL</option>
                            <option value="link">Link URL</option>
                        </select>
                    </td>
                </tr>
                <tr><th><label>Content</label></th><td><textarea name="material_content" class="large-text" rows="3" required></textarea></td></tr>
            </table>
            <p><input type="submit" name="vp_aff_add_material" class="button-primary" value="Add Material" /></p>
        </form>

        <table class="widefat striped" style="max-width:900px;">
            <thead><tr><th>Title</th><th>Type</th><th>Content</th><th>Submitted By</th><th>Status</th><th>Added</th><th></th></tr></thead>
            <tbody>
                <?php if ( ! $materials ) : ?>
                    <tr><td colspan="7">No marketing materials yet for this storefront.</td></tr>
                <?php endif; ?>
                <?php foreach ( $materials as $m ) : ?>
                    <tr<?php echo $m->status === 'pending' ? ' style="background:#fef9e7;"' : ''; ?>>
                        <td><?php echo esc_html( $m->title ); ?></td>
                        <td><?php echo esc_html( ucfirst( $m->type ) ); ?></td>
                        <td style="max-width:300px;overflow-wrap:break-word;"><?php echo esc_html( mb_strimwidth( $m->content, 0, 120, '…' ) ); ?></td>
                        <td><?php echo $m->affiliate_name ? esc_html( $m->affiliate_name ) . ' (affiliate)' : '<span class="description">Admin</span>'; ?></td>
                        <td>
                            <span style="padding:2px 8px;border-radius:3px;font-size:11px;<?php echo $m->status === 'approved' ? 'background:#d4edda;color:#155724' : 'background:#fff3cd;color:#856404'; ?>">
                                <?php echo esc_html( strtoupper( $m->status ) ); ?>
                            </span>
                        </td>
                        <td><?php echo esc_html( $m->created_at ); ?></td>
                        <td>
                            <?php if ( $m->status === 'pending' ) : ?>
                                <form method="post" style="display:inline-block;margin-right:6px;">
                                    <?php wp_nonce_field( 'vp_aff_approve_material' ); ?>
                                    <input type="hidden" name="material_id" value="<?php echo (int) $m->id; ?>" />
                                    <button type="submit" name="vp_aff_approve_material" class="button button-primary button-small">Approve</button>
                                </form>
                            <?php endif; ?>
                            <form method="post" style="display:inline-block;" onsubmit="return confirm('Delete this material?');">
                                <?php wp_nonce_field( 'vp_aff_delete_material' ); ?>
                                <input type="hidden" name="material_id" value="<?php echo (int) $m->id; ?>" />
                                <button type="submit" name="vp_aff_delete_material" class="button button-small"><?php echo $m->status === 'pending' ? 'Reject' : 'Delete'; ?></button>
                            </form>
                        </td>
                    </tr>
                <?php endforeach; ?>
            </tbody>
        </table>
    </div>
    <?php
}

// ═══════════════════════════════════════════════════════════════════════════════
// ALL AFFILIATES (ALL BRANDS) — consolidated cross-brand view. Each affiliate
// row in the DB still belongs to exactly one storefront (its own ref code,
// coupon, commission %, click/sale tracking all stay per-brand — that's the
// right level for real money), but this page groups those rows by email so
// an admin can see, at a glance, which brand(s) one person is already an
// affiliate for, create a brand-new affiliate on 1/2/3 brands at once, or
// extend an existing affiliate to another brand in one click. Extending
// reuses their name/password/payout info so the same login works everywhere
// they're active — only the ref code/coupon/commission differ per brand.
// ═══════════════════════════════════════════════════════════════════════════════

function vp_aff_render_people_page(): void {
    if ( ! current_user_can( 'manage_woocommerce' ) ) return;

    global $wpdb;
    $affTable    = $wpdb->prefix . 'vp_affiliates';
    $storefronts = vp_aff_storefront_labels();
    $notice      = '';

    // ── Create a brand-new affiliate on one or more brands at once ──
    if ( isset( $_POST['vp_aff_create_multi'] ) ) {
        check_admin_referer( 'vp_aff_create_multi' );
        $name     = sanitize_text_field( $_POST['name'] ?? '' );
        $email    = sanitize_email( $_POST['email'] ?? '' );
        $password = (string) ( $_POST['password'] ?? '' );
        $pctRaw   = $_POST['commission_pct'] ?? '';
        $pct      = $pctRaw === '' ? null : (float) $pctRaw;
        $targets  = array_values( array_intersect( array_map( 'sanitize_text_field', (array) ( $_POST['storefronts'] ?? [] ) ), array_keys( $storefronts ) ) );

        if ( ! $name || ! is_email( $email ) || strlen( $password ) < 8 ) {
            $notice = 'ERROR: name, valid email, and an 8+ character password are required.';
        } elseif ( ! $targets ) {
            $notice = 'ERROR: pick at least one brand.';
        } else {
            $created = [];
            $skipped = [];
            foreach ( $targets as $sf ) {
                $exists = $wpdb->get_var( $wpdb->prepare( "SELECT id FROM {$affTable} WHERE email = %s AND storefront = %s", $email, $sf ) );
                if ( $exists ) { $skipped[] = $storefronts[ $sf ]; continue; }
                $ref_code = vp_aff_generate_ref_code( $name );
                $wpdb->insert( $affTable, [
                    'name' => $name, 'email' => $email, 'password_hash' => wp_hash_password( $password ),
                    'ref_code' => $ref_code, 'storefront' => $sf, 'commission_pct' => $pct, 'status' => 'active',
                ] );
                vp_aff_ensure_coupon( (int) $wpdb->insert_id );
                $created[] = $storefronts[ $sf ];
            }
            $notice = $created ? ( 'Created affiliate on: ' . implode( ', ', $created ) . '. Same email/password logs into every brand they\'re active on.' ) : 'Nothing created — already existed on every brand picked.';
            if ( $skipped ) $notice .= ' Already existed on: ' . implode( ', ', $skipped ) . '.';
        }
    }

    // ── Extend an existing affiliate (by email) to additional brand(s) ──
    if ( isset( $_POST['vp_aff_extend_brands'] ) ) {
        check_admin_referer( 'vp_aff_extend_brands' );
        $email   = sanitize_email( $_POST['email'] ?? '' );
        $targets = array_values( array_intersect( array_map( 'sanitize_text_field', (array) ( $_POST['storefronts'] ?? [] ) ), array_keys( $storefronts ) ) );
        $source  = $email ? $wpdb->get_row( $wpdb->prepare( "SELECT * FROM {$affTable} WHERE email = %s ORDER BY created_at ASC LIMIT 1", $email ) ) : null;

        if ( ! $source ) {
            $notice = 'ERROR: could not find that affiliate.';
        } elseif ( ! $targets ) {
            $notice = 'Pick at least one brand to add them to.';
        } else {
            $created = [];
            $skipped = [];
            foreach ( $targets as $sf ) {
                $exists = $wpdb->get_var( $wpdb->prepare( "SELECT id FROM {$affTable} WHERE email = %s AND storefront = %s", $email, $sf ) );
                if ( $exists ) { $skipped[] = $storefronts[ $sf ]; continue; }
                $ref_code = vp_aff_generate_ref_code( $source->name );
                $wpdb->insert( $affTable, [
                    'name' => $source->name, 'email' => $email, 'password_hash' => $source->password_hash,
                    'ref_code' => $ref_code, 'storefront' => $sf, 'commission_pct' => null, 'status' => 'active',
                    'payout_method' => $source->payout_method, 'payout_destination' => $source->payout_destination,
                ] );
                vp_aff_ensure_coupon( (int) $wpdb->insert_id );
                $created[] = $storefronts[ $sf ];
            }
            $notice = $created ? ( esc_html( $source->name ) . ' added to: ' . implode( ', ', $created ) . ' — their existing login works there too.' ) : 'Nothing to add — already active on every brand picked.';
            if ( $skipped ) $notice .= ' Already had a row on: ' . implode( ', ', $skipped ) . '.';
        }
    }

    // ── Group every affiliate row by email so each person shows once ──
    $all_rows = $wpdb->get_results( "SELECT * FROM {$affTable} ORDER BY created_at ASC" );
    $people   = [];
    foreach ( $all_rows as $row ) {
        $key = strtolower( $row->email );
        if ( ! isset( $people[ $key ] ) ) {
            $people[ $key ] = [ 'name' => $row->name, 'email' => $row->email, 'brands' => [] ];
        }
        $people[ $key ]['brands'][ $row->storefront ] = $row;
    }
    ksort( $people );
    ?>
    <div class="wrap">
        <h1>All Affiliates — every brand</h1>
        <p class="description">Each brand still tracks its own referral link, coupon, commission %, and sales — full detail lives on that brand's own tab. This page is just the consolidated view: who's an affiliate for which brand(s), and a quick way to add someone to another brand without re-entering their info.</p>
        <?php if ( $notice ): ?>
            <div class="notice <?php echo str_starts_with( $notice, 'ERROR' ) ? 'notice-error' : 'notice-success'; ?>"><p><?php echo esc_html( $notice ); ?></p></div>
        <?php endif; ?>

        <h2>Add a New Affiliate</h2>
        <p class="description">Pick 1, 2, or 3 brands — one affiliate account is created per brand picked, all sharing this email/password, each with its own referral code and coupon.</p>
        <form method="post" style="margin-bottom:30px">
            <?php wp_nonce_field( 'vp_aff_create_multi' ); ?>
            <table class="form-table">
                <tr><th><label>Name</label></th><td><input type="text" name="name" class="regular-text" required /></td></tr>
                <tr><th><label>Email</label></th><td><input type="email" name="email" class="regular-text" required /></td></tr>
                <tr><th><label>Password</label></th><td><input type="text" name="password" class="regular-text" required minlength="8" /> <span class="description">at least 8 characters — same password on every brand picked</span></td></tr>
                <tr><th><label>Commission % override</label></th><td><input type="number" step="0.01" min="0" max="100" name="commission_pct" class="small-text" placeholder="default" /> <span class="description">leave blank to use each brand's own default</span></td></tr>
                <tr>
                    <th><label>Brands</label></th>
                    <td>
                        <?php foreach ( $storefronts as $sf => $label ): ?>
                            <label style="margin-right:16px"><input type="checkbox" name="storefronts[]" value="<?php echo esc_attr( $sf ); ?>"> <?php echo esc_html( $label ); ?></label>
                        <?php endforeach; ?>
                    </td>
                </tr>
            </table>
            <p><button type="submit" name="vp_aff_create_multi" class="button button-primary">Create Affiliate</button></p>
        </form>

        <hr>

        <h2>Everyone (<?php echo count( $people ); ?>)</h2>
        <table class="widefat striped">
            <thead>
                <tr>
                    <th style="width:22%">Name / Email</th>
                    <th>Brands</th>
                    <th style="width:32%">Add to another brand</th>
                </tr>
            </thead>
            <tbody>
                <?php if ( ! $people ): ?>
                    <tr><td colspan="3">No affiliates yet on any brand.</td></tr>
                <?php endif; ?>
                <?php foreach ( $people as $p ):
                    $missing = array_diff( array_keys( $storefronts ), array_keys( $p['brands'] ) );
                    ?>
                    <tr>
                        <td><strong><?php echo esc_html( $p['name'] ); ?></strong><br><span class="description"><?php echo esc_html( $p['email'] ); ?></span></td>
                        <td>
                            <?php foreach ( $storefronts as $sf => $label ):
                                $row = $p['brands'][ $sf ] ?? null;
                                if ( ! $row ) continue;
                                $bg = match ( $row->status ) {
                                    'active'  => 'background:#d4edda;color:#155724',
                                    'pending' => 'background:#fff3cd;color:#856404',
                                    default   => 'background:#f8d7da;color:#721c24',
                                };
                                ?>
                                <a href="<?php echo esc_url( admin_url( "admin.php?page=vp-affiliates&storefront={$sf}" ) ); ?>" style="text-decoration:none">
                                    <span style="display:inline-block;margin:2px 4px 2px 0;padding:2px 8px;border-radius:3px;font-size:11px;<?php echo $bg; ?>">
                                        <?php echo esc_html( $label ); ?> — <?php echo esc_html( ucfirst( $row->status ) ); ?> (<?php echo esc_html( $row->ref_code ); ?>)
                                    </span>
                                </a>
                            <?php endforeach; ?>
                        </td>
                        <td>
                            <?php if ( $missing ): ?>
                                <form method="post" style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
                                    <?php wp_nonce_field( 'vp_aff_extend_brands' ); ?>
                                    <input type="hidden" name="email" value="<?php echo esc_attr( $p['email'] ); ?>" />
                                    <?php foreach ( $missing as $sf ): ?>
                                        <label><input type="checkbox" name="storefronts[]" value="<?php echo esc_attr( $sf ); ?>"> <?php echo esc_html( $storefronts[ $sf ] ); ?></label>
                                    <?php endforeach; ?>
                                    <button type="submit" name="vp_aff_extend_brands" class="button button-small">Add</button>
                                </form>
                            <?php else: ?>
                                <span class="description">Already on all 3 brands.</span>
                            <?php endif; ?>
                        </td>
                    </tr>
                <?php endforeach; ?>
            </tbody>
        </table>
    </div>
    <?php
}
