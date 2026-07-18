/**
 * Server-only WooCommerce helpers.
 *
 * Credentials are read from server env vars (NOT prefixed NEXT_PUBLIC_), so
 * they are never included in the client bundle. All browser calls go through
 * the /api/wc/* and /api/auth/* route handlers, which use these helpers.
 *
 * Required env (see .env.local.example):
 *   WC_URL     = https://cms.vertalispeptides.com      (your headless WordPress site)
 *   WC_KEY     = ck_xxxxxxxxxxxxxxxxxxxxxxxx
 *   WC_SECRET  = cs_xxxxxxxxxxxxxxxxxxxxxxxx
 */

import "server-only";

export const WC_URL = process.env.WC_URL ?? "";
const WC_KEY = process.env.WC_KEY ?? "";
const WC_SECRET = process.env.WC_SECRET ?? "";

export const wcConfigured = Boolean(WC_URL && WC_KEY && WC_SECRET);

export function wcAuthHeader(): string {
  return "Basic " + Buffer.from(`${WC_KEY}:${WC_SECRET}`).toString("base64");
}

export const WC_REST_BASE = `${WC_URL}/wp-json/wc/v3`;
/** Custom auth plugin namespace (companion WP plugin, mirrors Valkyrie's router). */
export const WC_AUTH_BASE = `${WC_URL}/wp-json/nvr/v1`;

/** Fetch against the WooCommerce REST API with admin credentials (server-side). */
export async function wcServerFetch(
  path: string,
  init: RequestInit = {}
): Promise<Response> {
  return fetch(`${WC_REST_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: wcAuthHeader(),
      ...(init.headers ?? {}),
    },
    // Product data can be cached briefly; callers override as needed.
    cache: init.cache ?? "no-store",
  });
}
