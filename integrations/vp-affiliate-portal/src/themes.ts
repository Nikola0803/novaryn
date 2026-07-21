/**
 * Storefront theme registry.
 *
 * One login/dashboard implementation, reskinned per storefront so affiliates
 * still feel like they're on "their" brand's site even though this portal is
 * a single deployment talking to this WordPress install's own vp-affiliates
 * (Vertalis Affiliates) plugin.
 *
 * This is Vertalis's OWN standalone deployment of the shared portal codebase
 * (ported from the multi-brand Vintage Peptides / My Secret Vitality /
 * Liberty Peptides "Calibrate Research Network" build) — Vertalis runs its
 * own separate WooCommerce/WordPress backend (cms.vertalispeptides.com), so
 * it is not a 4th tab bolted onto that other network's portal. It is its own
 * install of the same well-tested pattern, seeded with a single storefront.
 *
 * To add a sibling Vertalis storefront later: add an entry here with its
 * colors/fonts/site URL, add the matching slug to VPAFF_STOREFRONTS in the
 * vp-affiliates.php plugin, then point that storefront's "Affiliate Login"
 * link at `https://<this-portal-domain>/<id>/login`. No other code changes
 * needed.
 */

import type { CSSProperties } from 'react';

/** Vertalis site visual identity — matches app/layout.tsx + globals.css on the main storefront. */
const VERTALIS_FONTS = {
  heading: '"Space Grotesk", -apple-system, sans-serif',
  body: '"Inter", -apple-system, "Segoe UI", sans-serif',
  mono: '"JetBrains Mono", "SFMono-Regular", "Courier New", monospace',
};

const VERTALIS_COLORS = {
  bg: '#08090B',
  surface: '#101215',
  surfaceAlt: '#16181C',
  border: 'rgba(94,232,213,0.16)',
  text: '#E9EDF2',
  textMuted: 'rgba(233,237,242,0.55)',
  accent: '#5EE8D5',
  accentHover: '#a8f5ed',
  accentText: '#08090B',
};

export interface StorefrontTheme {
  id: string;
  name: string;
  /** The storefront's own live site — referral links and the "back to site" link point here. */
  siteUrl: string;
  fonts: {
    heading: string;
    body: string;
    mono: string;
  };
  colors: {
    bg: string;
    surface: string;
    surfaceAlt: string;
    border: string;
    text: string;
    textMuted: string;
    accent: string;
    accentHover: string;
    /** Text color to use on top of an accent-colored background/button. */
    accentText: string;
  };
}

export const THEMES: Record<string, StorefrontTheme> = {
  vertalis: {
    id: 'vertalis',
    name: 'Vertalis Peptides',
    siteUrl: 'https://vertalispeptides.com',
    fonts: VERTALIS_FONTS,
    colors: VERTALIS_COLORS,
  },
  // 'sibling-slug': {
  //   id: 'sibling-slug',
  //   name: 'Sibling Brand Name',
  //   siteUrl: 'https://siblingbrand.com',
  //   fonts: VERTALIS_FONTS,
  //   colors: VERTALIS_COLORS, // or its own palette, if the sibling brand should look different
  // },
};

/** Network-level brand — shown in the shared nav/footer instead of any one storefront's name. */
export const NETWORK_NAME = 'Vertalis Affiliates';

export const DEFAULT_THEME_ID = 'vertalis';

export function getTheme(id: string | undefined): StorefrontTheme {
  if (id && THEMES[id]) return THEMES[id];
  return THEMES[DEFAULT_THEME_ID];
}

/** CSS custom properties for a theme — applied inline on the page wrapper. */
export function themeCssVars(theme: StorefrontTheme): CSSProperties {
  return {
    '--vp-bg': theme.colors.bg,
    '--vp-surface': theme.colors.surface,
    '--vp-surface-alt': theme.colors.surfaceAlt,
    '--vp-border': theme.colors.border,
    '--vp-text': theme.colors.text,
    '--vp-text-muted': theme.colors.textMuted,
    '--vp-accent': theme.colors.accent,
    '--vp-accent-hover': theme.colors.accentHover,
    '--vp-accent-text': theme.colors.accentText,
    '--vp-font-heading': theme.fonts.heading,
    '--vp-font-body': theme.fonts.body,
    '--vp-font-mono': theme.fonts.mono,
  } as CSSProperties;
}
