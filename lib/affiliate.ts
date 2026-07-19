/**
 * Affiliate referral capture (GoAffPro-style).
 *
 * Captures the "?ref=" query param on load and stores it in localStorage so it
 * survives client-side navigation. Mirrors the Valkyrie approach; safe to call
 * on every page load. All calls no-op gracefully if storage is unavailable.
 */

const REF_KEY = "dcode";
const RELOAD_FLAG_PREFIX = "nvr_dcode_autoreload_";

export function captureAffiliateRef(): void {
  try {
    const ref = new URLSearchParams(window.location.search).get("ref");
    if (ref) localStorage.setItem(REF_KEY, ref);
  } catch {
    /* storage unavailable (e.g. privacy mode), ignore */
  }
}

export function getAffiliateRef(): string | null {
  try {
    return localStorage.getItem(REF_KEY);
  } catch {
    return null;
  }
}

/**
 * Some affiliate providers only resolve a "?ref=" slug into the real coupon
 * code after a reload. Force one reload at a meaningful moment (cart/checkout),
 * guarded to once per ref per tab.
 */
export function triggerDcodeReloadWorkaround(): void {
  try {
    const ref =
      new URLSearchParams(window.location.search).get("ref") ?? localStorage.getItem(REF_KEY);
    if (!ref) return;
    const flag = RELOAD_FLAG_PREFIX + ref;
    if (sessionStorage.getItem(flag)) return;
    sessionStorage.setItem(flag, "1");
    window.location.reload();
  } catch {
    /* ignore */
  }
}
