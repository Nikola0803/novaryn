"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useCart } from "@/lib/cart-context";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/shop", label: "Shop Peptides" },
  { href: "/about", label: "About Us" },
  { href: "/affiliate", label: "Lab Affiliate Program" },
  { href: "/coa", label: "COAs" },
  { href: "/contact", label: "Contact Us" },
];

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { count, openCart } = useCart();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-precision ${
        scrolled
          ? "bg-background-800/85 backdrop-blur-xl border-b border-background-200/60"
          : "bg-transparent border-b border-transparent"
      }`}
    >
      <div className="w-full px-6 md:px-10 h-[72px] flex items-center justify-between">
        <Link className="group flex items-center gap-2.5 cursor-pointer" href="/">
          <span className="relative w-7 h-7 flex items-center justify-center">
            <span className="absolute inset-0 rounded-md border border-primary-500/40 rotate-45"></span>
            <span className="absolute inset-1.5 rounded-sm bg-primary-500/15"></span>
            <span className="relative w-1.5 h-1.5 rounded-full bg-primary-500 shadow-[0_0_10px_2px_rgba(94,232,213,0.6)]"></span>
          </span>
          <span className="font-display text-[18px] tracking-[0.28em] text-foreground-100 group-hover:text-primary-500 transition-colors">
            NOVARYN
          </span>
        </Link>
        <nav className="hidden lg:flex items-center gap-10">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-[13px] tracking-wide text-foreground-300 hover:text-foreground-100 transition-colors relative group"
            >
              {link.label}
              <span className="absolute -bottom-1.5 left-0 h-px w-0 bg-primary-500 transition-all duration-500 ease-precision group-hover:w-full"></span>
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <button
            aria-label="Search"
            className="hidden md:flex w-9 h-9 items-center justify-center rounded-md text-foreground-300 hover:text-primary-500 hover:bg-background-200/60 transition-colors cursor-pointer"
          >
            <i className="ri-search-line text-[17px]"></i>
          </button>
          <Link
            href="/account"
            className="hidden md:flex w-9 h-9 items-center justify-center rounded-md text-foreground-300 hover:text-primary-500 hover:bg-background-200/60 transition-colors cursor-pointer"
          >
            <i className="ri-user-line text-[17px]"></i>
          </Link>
          <button
            onClick={openCart}
            className="relative flex w-9 h-9 items-center justify-center rounded-md text-foreground-100 hover:text-primary-500 hover:bg-background-200/60 transition-colors cursor-pointer"
            aria-label="Open cart"
          >
            <i className="ri-shopping-bag-3-line text-[17px]"></i>
            {count > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 flex items-center justify-center rounded-full bg-primary-500 text-background-900 font-mono text-[9px] font-semibold">
                {count}
              </span>
            )}
          </button>
          <Link
            href="/shop"
            className="hidden md:inline-flex ml-2 h-9 items-center px-4 rounded-md bg-primary-500 text-background-900 text-[12px] font-semibold tracking-wide hover:bg-primary-400 transition-all duration-300 ease-precision hover:shadow-[0_0_24px_-4px_rgba(94,232,213,0.6)] whitespace-nowrap cursor-pointer"
          >
            Shop Peptides
          </Link>
          <button
            aria-label="Menu"
            onClick={() => setMenuOpen((v) => !v)}
            className="lg:hidden w-9 h-9 flex items-center justify-center rounded-md text-foreground-100 hover:bg-background-200/60 cursor-pointer"
          >
            <i className={`${menuOpen ? "ri-close-line" : "ri-menu-line"} text-[19px]`}></i>
          </button>
        </div>
      </div>
      {menuOpen && (
        <div className="lg:hidden bg-background-800/95 backdrop-blur-xl border-b border-background-200/60">
          <nav className="flex flex-col px-6 py-4">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="py-3 text-[13px] tracking-wide text-foreground-300 hover:text-foreground-100 transition-colors border-b border-background-200/40 last:border-none"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
