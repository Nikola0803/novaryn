# Novaryn — Compliance & CMS Integration

This document covers the compliance scaffolding and CMS wiring added to the
Novaryn site, what still needs your input before you sell, and how the account
wall backend works.

> **Important, and please read this honestly.** What's below is the *technical
> compliance scaffolding* that research-peptide storefronts (including Valkyrie)
> use: an age + research-use gate, the standard legal pages, RUO disclaimers,
> and consent capture. Putting these in place does **not** by itself make a
> peptide business "fully legal." Whether you can lawfully sell a given compound,
> to whom, with what labelling, using which payment rails, and in which
> jurisdictions, is a legal question that depends on the specific products and
> your location — and in this space (FDA/FD&C Act, controlled-substance analogues,
> import rules, card-network policies) the answers genuinely vary. Treat this as
> the site-side groundwork, and have the finished site, product list, and terms
> reviewed by a lawyer who knows this industry before you take orders. I've
> flagged every place that needs a real decision.

---

## 1. What was implemented

**Access gate — `components/NovarynGate.tsx`** (mounted globally in
`app/layout.tsx`).
- Same split-panel pattern as Valkyrie's `AccessGate`, rebuilt in Novaryn's dark
  lab aesthetic (obsidian panel, cyan accent, mono type, product-render backdrop).
- **Age (21+) + Research-Use-Only consent is mandatory** on every path.
- Three modes: **Enter Site** (guest research access — age/RUO consent only),
  **Sign In**, **Create Account**.
- The guest path works with **no backend**, so the gate is never a dead end. The
  Sign In / Create Account paths light up once the CMS backend is connected.
- Access is remembered in `localStorage` for 30 days. Children render underneath
  the overlay (so pages stay crawlable / no layout shift) with body scroll locked.

**Legal pages** (dark-themed, content ported from Valkyrie and rebranded):
- `/legal/research-use` — Research Use Only policy
- `/legal/terms` — Terms of Service
- `/legal/privacy` — Privacy Policy
- `/legal/shipping-returns` — Shipping & Returns (Valkyrie's shipping + return
  content merged, since the Novaryn footer already links a single combined route)

These routes match the links already present in `components/SiteFooter.tsx`.

**One place to edit everything — `data/site-config.ts`.** Brand name, legal
entity, minimum age, contact details, governing law, shipping regions, testing
partners, and the "last updated" date all live here. Every legal page and the
gate read from it. Blank contact fields are hidden gracefully.

**CMS / commerce layer** (mirrors Valkyrie's, but secrets stay server-side):
- `lib/woocommerce.ts` — products, orders, coupons, reviews, coupon validation,
  and a `normalizeProduct` mapper (same shape as Valkyrie).
- `lib/mailchimp.ts` — newsletter subscribe.
- `lib/affiliate.ts` — GoAffPro-style `?ref=` capture.
- `lib/wc-server.ts` + `app/api/*` route handlers — the actual credentialed
  calls run on the server.

---

## 2. Security note (a deliberate change from Valkyrie)

Valkyrie is a Vite build, so its WooCommerce `ck`/`cs` keys and Mailchimp key are
compiled into the browser bundle — anyone can read them and hit the store's
admin API. Because Novaryn is Next.js, I routed every credentialed call through
same-origin server handlers instead:

- `/api/wc/[...path]` — authenticated WooCommerce proxy. Reads are open; writes
  are allow-listed to **orders and reviews only**, so the admin keys can't be
  used from the browser to create products or customers.
- `/api/auth/login|register|validate` — proxy to the WordPress auth plugin.
- `/api/newsletter` — Mailchimp subscribe, key held server-side.

Keys live in `.env.local` (see `.env.local.example`) and are **not** prefixed
`NEXT_PUBLIC_`, so they never reach the client. If you migrated Valkyrie's keys
anywhere public, rotate them.

---

## 3. Before you sell — fill these in

Edit `data/site-config.ts`:

- [ ] `contactEmail` and/or `contactPhone` — currently blank (hidden on pages).
- [ ] `businessAddress` — registered mailing address, if you want it shown.
- [ ] `governingLaw` — **confirm with counsel.** Placeholder is generic.
- [ ] `shipsTo` — your real fulfilment regions (default: United States).
- [ ] `minimumAge` — set to 21 (matches the gate). Change if your policy differs.
- [ ] `legalLastUpdated` — bump when you finalise the policies.

Set up `.env.local` (copy from `.env.local.example`):

- [ ] `WC_URL`, `WC_KEY`, `WC_SECRET` — headless WordPress/WooCommerce.
- [ ] `MAILCHIMP_API_KEY`, `MAILCHIMP_LIST_ID` — newsletter (optional).

Business / legal decisions (not code):

- [ ] Have a lawyer review the product list, labelling, and all four legal pages.
- [ ] Confirm each compound is one you can lawfully offer, RUO-labelled, in your
      markets.
- [ ] Payment: the footer advertises Zelle / Cash App / Venmo. Card processors
      frequently decline this vertical, and P2P apps have their own acceptable-use
      rules — confirm your chosen method actually permits these sales.
- [ ] Decide whether age/RUO consent should also be re-affirmed at checkout (many
      operators do both gate + checkbox at purchase).

---

## 4. Account wall backend (companion WordPress plugin)

The **Enter Site** (guest) path needs nothing. **Sign In / Create Account** need
a tiny WordPress plugin exposing three REST routes under the `nvr/v1` namespace,
exactly mirroring Valkyrie's `valkyrie-router.php`:

```
POST  {WC_URL}/wp-json/nvr/v1/login      { email, password }
        -> 200 { token, email, username, user_id }   (401 on bad creds)

POST  {WC_URL}/wp-json/nvr/v1/register   { email, password, username?, marketingOptIn? }
        -> 200 { token, email, username, user_id }   (409 if email exists)

POST  {WC_URL}/wp-json/nvr/v1/validate   { token }
        -> 200 { valid: true | false }
```

The Novaryn `/api/auth/*` handlers already proxy to these. Until the plugin is
installed, the account tabs return a friendly "not available yet — use Enter
Site" message and the gate still works. (You can adapt Valkyrie's existing router
PHP; just rename the namespace to `nvr/v1`.)

---

## 5. How to test

```bash
npm install
npm run build      # type-checks + builds; currently passes clean
npm start          # http://localhost:3000
```

- Load any page → the gate appears. Tick the 21+/RUO box → **Enter Site** → you're in.
- Reload → you stay in for 30 days (clear `localStorage` to see the gate again).
- Visit `/legal/research-use`, `/legal/terms`, `/legal/privacy`,
  `/legal/shipping-returns` and the footer links to them.
- With `WC_*` env vars set (+ the plugin), Sign In / Create Account and the
  product/order APIs go live.
