import { NextResponse } from "next/server";
import crypto from "crypto";

export const runtime = "nodejs";

/**
 * POST /api/newsletter  { email, firstName?, lastName?, tags? }
 *
 * Server-side Mailchimp subscribe. The API key and audience/list ID live in
 * server env vars and never reach the browser.
 *
 *   MAILCHIMP_API_KEY = xxxxxxxxxxxxxxxxxxxxxxxx-us9   (suffix = data center)
 *   MAILCHIMP_LIST_ID = xxxxxxxxxx
 */
export async function POST(req: Request) {
  const apiKey = process.env.MAILCHIMP_API_KEY ?? "";
  const listId = process.env.MAILCHIMP_LIST_ID ?? "";
  const dc = apiKey.split("-")[1]; // e.g. "us9"

  if (!apiKey || !listId || !dc) {
    return NextResponse.json(
      { ok: false, message: "Newsletter isn't configured yet." },
      { status: 501 }
    );
  }

  const { email, firstName = "", lastName = "", tags = [] } = await req
    .json()
    .catch(() => ({}));
  if (!email || typeof email !== "string" || !email.includes("@")) {
    return NextResponse.json({ ok: false, message: "A valid email is required." }, { status: 400 });
  }

  const hash = crypto.createHash("md5").update(email.toLowerCase().trim()).digest("hex");
  const auth = "Basic " + Buffer.from(`x:${apiKey}`).toString("base64");

  try {
    const res = await fetch(
      `https://${dc}.api.mailchimp.com/3.0/lists/${listId}/members/${hash}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: auth },
        body: JSON.stringify({
          email_address: email.toLowerCase().trim(),
          status_if_new: "subscribed",
          status: "subscribed",
          merge_fields: { FNAME: firstName, LNAME: lastName },
          tags,
        }),
      }
    );
    if (res.ok) return NextResponse.json({ ok: true });
    const err = (await res.json().catch(() => ({}))) as { detail?: string };
    return NextResponse.json(
      { ok: false, message: err.detail ?? "Subscription failed." },
      { status: res.status }
    );
  } catch {
    return NextResponse.json({ ok: false, message: "Network error. Please try again." }, { status: 502 });
  }
}
