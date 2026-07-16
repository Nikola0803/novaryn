/**
 * Newsletter subscribe (client wrapper).
 * Posts to the same-origin /api/newsletter handler, which talks to Mailchimp
 * server-side so the API key is never exposed to the browser.
 */

export interface SubscribeOptions {
  email: string;
  firstName?: string;
  lastName?: string;
  tags?: string[];
}

export async function subscribeToNewsletter(
  opts: SubscribeOptions
): Promise<{ ok: boolean; message?: string }> {
  try {
    const res = await fetch("/api/newsletter", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(opts),
    });
    const data = (await res.json().catch(() => ({}))) as { ok?: boolean; message?: string };
    return { ok: Boolean(data.ok), message: data.message };
  } catch {
    return { ok: false, message: "Network error. Please try again." };
  }
}
