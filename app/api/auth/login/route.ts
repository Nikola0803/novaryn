import { NextResponse } from "next/server";
import { WC_AUTH_BASE, wcConfigured } from "@/lib/wc-server";

export const runtime = "nodejs";

/**
 * POST /api/auth/login  { email, password }
 * Proxies to the companion WordPress plugin endpoint  nvr/v1/login,
 * which validates credentials and returns { token, email, username, user_id }.
 * See COMPLIANCE.md → "Account wall backend" for the plugin.
 */
export async function POST(req: Request) {
  if (!wcConfigured) {
    return NextResponse.json(
      { error: "Account sign-in isn't available yet. You can continue via Enter Site." },
      { status: 501 }
    );
  }
  const { email, password } = await req.json().catch(() => ({}));
  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  }

  try {
    const res = await fetch(`${WC_AUTH_BASE}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return NextResponse.json(
        { error: data?.error || data?.message || "Invalid email or password." },
        { status: res.status }
      );
    }
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Could not reach the account service." }, { status: 502 });
  }
}
