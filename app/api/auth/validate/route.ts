import { NextResponse } from "next/server";
import { WC_AUTH_BASE, wcConfigured } from "@/lib/wc-server";

export const runtime = "nodejs";

/**
 * POST /api/auth/validate  { token }
 * Confirms a stored session token is still valid. Returns { valid: boolean }.
 * When no backend is configured this simply reports invalid, so the gate
 * falls back to the guest research-access path.
 */
export async function POST(req: Request) {
  if (!wcConfigured) return NextResponse.json({ valid: false });

  const { token } = await req.json().catch(() => ({}));
  if (!token) return NextResponse.json({ valid: false });

  try {
    const res = await fetch(`${WC_AUTH_BASE}/validate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json({ valid: Boolean(data?.valid) });
  } catch {
    return NextResponse.json({ valid: false });
  }
}
