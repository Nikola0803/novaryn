import { NextRequest, NextResponse } from "next/server";
import { WC_URL } from "@/lib/wc-server";

/**
 * POST /api/affiliate/track-click
 *
 * Thin, unauthenticated proxy to the Vertalis Affiliates WordPress plugin's
 * public click-tracking endpoint. Called by components/AffiliateTracker.tsx
 * whenever a visitor arrives via an affiliate's ?ref= link. Kept as a
 * same-origin proxy (rather than hitting WC_URL directly from the browser)
 * so the WordPress host is never exposed in client-side network requests,
 * matching the pattern used by /api/wc/[...path].
 *
 * Requires the vp-affiliates plugin's POST /vp-affiliates/v1/track-click.
 * Fails soft in every case — this is best-effort click analytics, never
 * something that should surface an error to a shopper or block navigation.
 */

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  if (!WC_URL) {
    return NextResponse.json({ ok: false, configured: false }, { status: 200 });
  }

  let body: { ref_code?: string; landing_url?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  if (!body.ref_code) {
    return NextResponse.json({ error: "ref_code is required." }, { status: 400 });
  }

  try {
    const res = await fetch(`${WC_URL}/wp-json/vp-affiliates/v1/track-click`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ref_code: body.ref_code,
        storefront: "vertalis",
        landing_url: body.landing_url || "",
      }),
      cache: "no-store",
    });
    const data = await res.text();
    return new NextResponse(data, {
      status: res.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
