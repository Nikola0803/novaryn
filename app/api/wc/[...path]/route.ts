import { NextRequest, NextResponse } from "next/server";
import { wcConfigured, wcServerFetch } from "@/lib/wc-server";

/**
 * Authenticated WooCommerce proxy.
 *
 *   GET  /api/wc/products?slug=foo   ->  wc/v3/products?slug=foo
 *   POST /api/wc/orders              ->  wc/v3/orders
 *   PUT  /api/wc/orders/123          ->  wc/v3/orders/123
 *
 * Reads are allowlisted to genuinely public catalog data (products, coupon
 * lookups, reviews) — NOT orders or customers. Orders/customers carry PII
 * (name, address, phone, order contents); an open GET on this proxy would
 * let anyone on the internet page through every order in the store using
 * the admin key held server-side. A signed-in customer's own orders are
 * served instead by /api/account/orders, which resolves "whose orders"
 * from their session token server-side rather than trusting a client-
 * supplied customer id/email in the query string. Writes are separately
 * restricted to order creation/updates and review submission, so these
 * admin keys can never be used from the browser to mutate products either.
 */

export const runtime = "nodejs";

const READ_ALLOWLIST = [/^products(\/|$|\?)/, /^coupons(\/|$|\?)/];
const WRITE_ALLOWLIST = [/^orders(\/|$)/, /^products\/reviews(\/|$)/];

function notConfigured() {
  return NextResponse.json(
    { error: "Store backend is not configured yet.", configured: false },
    { status: 501 }
  );
}

async function resolvePath(ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  return (path ?? []).join("/");
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  if (!wcConfigured) return notConfigured();
  const path = await resolvePath(ctx);
  if (!READ_ALLOWLIST.some((re) => re.test(path))) {
    return NextResponse.json({ error: "Read not permitted for this resource." }, { status: 403 });
  }
  const qs = req.nextUrl.search; // includes leading "?"
  const res = await wcServerFetch(`/${path}${qs}`);
  const body = await res.text();
  return new NextResponse(body, {
    status: res.status,
    headers: { "Content-Type": "application/json" },
  });
}

async function write(
  req: NextRequest,
  ctx: { params: Promise<{ path: string[] }> },
  method: "POST" | "PUT"
) {
  if (!wcConfigured) return notConfigured();
  const path = await resolvePath(ctx);
  if (!WRITE_ALLOWLIST.some((re) => re.test(path))) {
    return NextResponse.json({ error: "Write not permitted for this resource." }, { status: 403 });
  }
  const payload = await req.text();
  const res = await wcServerFetch(`/${path}`, { method, body: payload });
  const body = await res.text();
  return new NextResponse(body, {
    status: res.status,
    headers: { "Content-Type": "application/json" },
  });
}

export function POST(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  return write(req, ctx, "POST");
}
export function PUT(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  return write(req, ctx, "PUT");
}
