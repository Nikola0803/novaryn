import { NextResponse } from "next/server";
import { WC_AUTH_BASE, wcConfigured, wcServerFetch } from "@/lib/wc-server";

export const runtime = "nodejs";

/**
 * POST /api/account/orders  { token }
 *
 * Returns the signed-in customer's own WooCommerce order history. The token
 * is resolved to a user_id via nvr/v1/me FIRST, server-side — the browser
 * never gets to say which customer's orders it wants (see the comment on
 * app/api/wc/[...path]/route.ts for why that matters: an open orders read
 * would leak every customer's name/address/phone to anyone).
 */
export async function POST(req: Request) {
  if (!wcConfigured) {
    return NextResponse.json({ error: "Account service isn't available yet." }, { status: 501 });
  }

  const { token } = await req.json().catch(() => ({}));
  if (!token) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  try {
    const meRes = await fetch(`${WC_AUTH_BASE}/me`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    const me = await meRes.json().catch(() => ({}));
    if (!meRes.ok || !me?.user_id) {
      return NextResponse.json({ error: "Your session has expired. Please sign in again." }, { status: 401 });
    }

    const res = await wcServerFetch(
      `/orders?customer=${encodeURIComponent(me.user_id)}&orderby=date&order=desc&per_page=50`
    );
    const orders = await res.json().catch(() => []);
    if (!res.ok) {
      return NextResponse.json({ error: "Could not load your orders." }, { status: res.status });
    }

    return NextResponse.json({ orders, email: me.email, username: me.username });
  } catch {
    return NextResponse.json({ error: "Could not reach the account service." }, { status: 502 });
  }
}
