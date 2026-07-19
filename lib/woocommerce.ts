/**
 * WooCommerce client for Vertalis Peptides (browser + server safe).
 *
 * Unlike a Vite build, this never holds the WooCommerce keys. Every request
 * goes through the same-origin /api/wc/* proxy, which attaches the admin
 * credentials on the server. Public API mirrors the Valkyrie client so screens
 * can be ported with minimal changes.
 */

const BASE = "/api/wc";

// ── Types ──────────────────────────────────────────────────────────────

export interface WCProduct {
  id: number;
  name: string;
  slug: string;
  permalink: string;
  status: string;
  description: string;
  short_description: string;
  sku: string;
  price: string;
  regular_price: string;
  sale_price: string;
  stock_status: "instock" | "outofstock" | "onbackorder";
  stock_quantity: number | null;
  categories: { id: number; name: string; slug: string }[];
  images: { id: number; src: string; alt: string }[];
  attributes: { id: number; name: string; options: string[] }[];
  meta_data: { key: string; value: string }[];
}

export interface WCOrderLine {
  product_id: number;
  quantity: number;
  name?: string;
  subtotal?: string;
  total?: string;
}

export interface WCOrderPayload {
  payment_method: string; // "zelle" | "cashapp" | "venmo"
  payment_method_title: string;
  set_paid: false;
  status: "pending";
  billing: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    address_1: string;
    city: string;
    state: string;
    postcode: string;
    country: string;
  };
  shipping: {
    first_name: string;
    last_name: string;
    address_1: string;
    city: string;
    state: string;
    postcode: string;
    country: string;
  };
  line_items: WCOrderLine[];
  coupon_lines?: { code: string }[];
  shipping_lines?: { method_title: string; method_id: string; total: string }[];
  fee_lines?: { name: string; total: string; tax_class: string; tax_status: string }[];
  customer_note?: string;
  meta_data?: { key: string; value: string }[];
}

export interface WCOrder {
  id: number;
  number: string;
  status: string;
  total: string;
  currency: string;
  billing: WCOrderPayload["billing"];
  line_items: (WCOrderLine & { id: number })[];
  date_created: string;
}

export interface WCReview {
  id: number;
  date_created: string;
  review: string;
  rating: number;
  name: string;
  email: string;
  verified: boolean;
  reviewer_avatar_urls: Record<string, string>;
}

export interface WCReviewPayload {
  product_id: number;
  review: string;
  reviewer: string;
  reviewer_email: string;
  rating: number;
}

export interface WCCoupon {
  id: number;
  code: string;
  discount_type: "percentage" | "percent" | "fixed_cart" | "fixed_product";
  amount: string;
  date_expires: string | null;
  usage_count: number;
  usage_limit: number | null;
  minimum_amount: string;
  maximum_amount: string;
  individual_use: boolean;
  free_shipping: boolean;
}

export type CouponResult =
  | { valid: true; coupon: WCCoupon; discountAmount: number; discountedTotal: number }
  | { valid: false; message: string };

// ── Fetch helper ───────────────────────────────────────────────────────

async function wc<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers ?? {}) },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`WC ${res.status}: ${path}\n${body}`);
  }
  return res.json() as Promise<T>;
}

// ── Products ───────────────────────────────────────────────────────────

export async function getAllProducts(perPage = 50): Promise<WCProduct[]> {
  const results: WCProduct[] = [];
  let page = 1;
  for (;;) {
    const batch = await wc<WCProduct[]>(
      `/products?status=publish&per_page=${perPage}&page=${page}&orderby=menu_order&order=asc`
    );
    results.push(...batch);
    if (batch.length < perPage) break;
    page++;
  }
  return results;
}

export async function getProductBySlug(slug: string): Promise<WCProduct | null> {
  const results = await wc<WCProduct[]>(
    `/products?slug=${encodeURIComponent(slug)}&status=publish`
  );
  return results[0] ?? null;
}

export async function getProductById(id: number): Promise<WCProduct> {
  return wc<WCProduct>(`/products/${id}`);
}

// ── Reviews ────────────────────────────────────────────────────────────

export async function getProductReviews(productId: number, perPage = 10): Promise<WCReview[]> {
  return wc<WCReview[]>(
    `/products/reviews?product=${productId}&status=approved&per_page=${perPage}&orderby=date_gmt&order=desc`
  );
}

export async function submitProductReview(payload: WCReviewPayload): Promise<WCReview> {
  return wc<WCReview>("/products/reviews", {
    method: "POST",
    body: JSON.stringify({ ...payload, status: "approved" }),
  });
}

// ── Orders ─────────────────────────────────────────────────────────────

export async function createOrder(payload: WCOrderPayload): Promise<WCOrder> {
  return wc<WCOrder>("/orders", { method: "POST", body: JSON.stringify(payload) });
}

export async function updateOrderStatus(
  orderId: number,
  status: "pending" | "processing" | "on-hold" | "completed" | "cancelled" | "refunded"
): Promise<WCOrder> {
  return wc<WCOrder>(`/orders/${orderId}`, { method: "PUT", body: JSON.stringify({ status }) });
}

export async function addOrderNote(
  orderId: number,
  note: string,
  customerNote = false
): Promise<{ id: number; note: string }> {
  return wc(`/orders/${orderId}/notes`, {
    method: "POST",
    body: JSON.stringify({ note, customer_note: customerNote }),
  });
}

// ── Coupons ────────────────────────────────────────────────────────────

export async function validateCoupon(code: string, subtotal: number): Promise<CouponResult> {
  try {
    const results = await wc<WCCoupon[]>(
      `/coupons?code=${encodeURIComponent(code.trim().toLowerCase())}&per_page=1`
    );
    if (!results.length) return { valid: false, message: "Coupon code not found." };

    const coupon = results[0];

    if (coupon.date_expires && new Date(coupon.date_expires) < new Date()) {
      return { valid: false, message: "This coupon has expired." };
    }
    if (coupon.usage_limit !== null && coupon.usage_count >= coupon.usage_limit) {
      return { valid: false, message: "This coupon has reached its usage limit." };
    }
    const min = parseFloat(coupon.minimum_amount);
    if (!isNaN(min) && min > 0 && subtotal < min) {
      return { valid: false, message: `Minimum order of $${min.toFixed(2)} required for this coupon.` };
    }

    let discountAmount = 0;
    const amt = parseFloat(coupon.amount);
    if (coupon.discount_type === "percent" || coupon.discount_type === "percentage") {
      discountAmount = (subtotal * amt) / 100;
    } else {
      discountAmount = Math.min(amt, subtotal);
    }
    const max = parseFloat(coupon.maximum_amount);
    if (!isNaN(max) && max > 0) discountAmount = Math.min(discountAmount, max);
    discountAmount = Math.round(discountAmount * 100) / 100;

    return {
      valid: true,
      coupon,
      discountAmount,
      discountedTotal: Math.max(0, subtotal - discountAmount),
    };
  } catch {
    return { valid: false, message: "Could not validate coupon. Please try again." };
  }
}

// ── Normalizer ─────────────────────────────────────────────────────────

function extractContent(slug: string, name: string): string | null {
  const pattern = /(\d+(?:\.\d+)?(?:mg|ml|mcg|iu|g))\b/gi;
  const match = [...slug.matchAll(pattern)].at(-1) ?? [...name.matchAll(pattern)].at(-1);
  return match ? match[1].toLowerCase() : null;
}

/** Maps a WooCommerce product onto the shape the Vertalis Peptides UI/cart expects. */
export function normalizeProduct(p: WCProduct) {
  const content = extractContent(p.slug, p.name);
  const metaCoa = p.meta_data.find((m) => m.key === "_novaryn_coa_images")?.value ?? "";
  const metaInfo = p.meta_data.find((m) => m.key === "_novaryn_additional_info")?.value ?? "";
  const purityPdf = p.meta_data.find((m) => m.key === "_novaryn_coa_purity_pdf")?.value ?? "";
  const endotoxinPdf = p.meta_data.find((m) => m.key === "_novaryn_coa_endotoxin_pdf")?.value ?? "";

  let coaImages: string[] = [];
  try {
    if (metaCoa) coaImages = JSON.parse(metaCoa as string);
  } catch {
    /* ignore */
  }

  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    category: p.categories[0]?.name ?? "Peptides",
    price: parseFloat(p.price) || 0,
    originalPrice: parseFloat(p.regular_price) || parseFloat(p.price) || 0,
    image: p.images[0]?.src ?? "/images/placeholder.png",
    images: p.images.map((img) => img.src),
    inStock: p.stock_status === "instock",
    description: p.description,
    shortDescription: p.short_description,
    sku: p.sku,
    content,
    coaImages,
    additionalInfo: metaInfo as string,
    purityPdfUrl: purityPdf as string,
    endotoxinPdfUrl: endotoxinPdf as string,
  };
}

export type NormalizedProduct = ReturnType<typeof normalizeProduct>;
