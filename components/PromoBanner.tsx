"use client";

import { useState } from "react";

const PROMO_CODE = "WELCOME10";

/**
 * PromoBanner — persistent strip above the main navbar.
 * Fixed height (h-10 / 40px) so Header.tsx can sit at a known top-10 offset
 * and every page's pt-[112px] (72px header + 40px banner) lines up.
 */
export default function PromoBanner() {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(PROMO_CODE);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard API unavailable (e.g. insecure context) — code is still readable to copy manually.
    }
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-[60] h-10 bg-background-900 border-b border-primary-500/15">
      <button
        type="button"
        onClick={handleCopy}
        aria-label={`Copy promo code ${PROMO_CODE}`}
        className="group w-full h-full flex items-center justify-center px-4 cursor-pointer"
      >
        <span className="flex items-center gap-2 max-w-full overflow-x-auto no-scrollbar whitespace-nowrap text-[11px] md:text-[12px] text-foreground-400 tracking-wide">
          <span>Use code</span>
          <span className="inline-flex items-center gap-1 rounded-full border border-primary-500/50 px-2.5 py-0.5 font-mono font-semibold tracking-[0.12em] text-primary-500 group-hover:bg-primary-500 group-hover:text-background-900 transition-colors duration-300 ease-precision">
            {copied ? "COPIED ✓" : PROMO_CODE}
          </span>
          <span>for 10% off your first order</span>
          <span className="hidden sm:inline text-foreground-600">— tap to copy</span>
        </span>
      </button>
    </div>
  );
}
