import { NextResponse } from "next/server";
import { WC_AUTH_BASE, wcConfigured } from "@/lib/wc-server";

export const runtime = "nodejs";

/**
 * POST /api/auth/register  { email, password, username?, marketingOptIn? }
 * Proxies to the companion WordPress plugin endpoint  nvr/v1/register,
 * which creates the WooCommerce customer and returns
 * { token, email, username, user_id }.
 */
export async function POST(req: Request) {
  if (!wcConfigured) {
    return NextResponse.json(
      { error: "Account creation isn't available yet. You can continue via Enter Site." },
      { status: 501 }
    );
  }
  const body = await req.json().catch(() => ({}));
  const { email, password } = body;
  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  }

  try {
    const res = await fetch(`${WC_AUTH_BASE}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg = data?.error || data?.message || "";
      if (String(msg).includes("existing_user_email") || String(msg).includes("already")) {
        return NextResponse.json(
          { error: "An account with this email already exists. Try signing in." },
          { status: 409 }
        );
      }
      return NextResponse.json({ error: msg || "Registration failed." }, { status: res.status });
    }
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Could not reach the account service." }, { status: 502 });
  }
}
