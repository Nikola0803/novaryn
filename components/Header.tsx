"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useCart } from "@/lib/cart-context";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/shop", label: "Shop Peptides" },
  { href: "/about", label: "About Us" },
  { href: "/affiliate", label: "Lab Affiliate Program" },
  { href: "/coa", label: "COAs" },
  { href: "/contact", label: "Contact Us" },
];

const CONTACT_DROPDOWN = [
  { slug: "blog", href: "/blog", name: "Blog", desc: "Research notes & methodology.", icon: "ri-article-line" },
  { slug: "veterans", href: "/veterans", name: "Vets & First Responders", desc: "23% off for life. How we honor service.", icon: "ri-medal-line" },
  { slug: "faq", href: "/faq", name: "FAQ", desc: "Answers before and after ordering.", icon: "ri-question-line" },
  { slug: "contact", href: "/contact", name: "Contact Us", desc: "Talk to a person, 7 days a week.", icon: "ri-mail-line" },
];

const SHOP_CATEGORIES = [
  {
    slug: "peptides",
    name: "Peptides",
    desc: "High-purity sequences for receptor & signaling research.",
    icon: "ri-flask-line",
  },
  {
    slug: "fat-loss-metabolic",
    name: "Fat Loss & Metabolic",
    desc: "GLP-1 agonists and metabolic pathway compounds.",
    icon: "ri-fire-line",
  },
  {
    slug: "recovery-repair",
    name: "Recovery & Repair",
    desc: "Tissue repair and regenerative signaling research.",
    icon: "ri-heart-pulse-line",
  },
  {
    slug: "longevity",
    name: "Longevity",
    desc: "Cellular, mitochondrial & telomere research.",
    icon: "ri-infinity-line",
  },
  {
    slug: "cognitive",
    name: "Cognitive",
    desc: "Neurotropic sequences for synaptic research.",
    icon: "ri-brain-line",
  },
  {
    slug: "peptide-blends",
    name: "Peptide Blends",
    desc: "Precision multi-compound research blends.",
    icon: "ri-drop-line",
  },
  {
    slug: "research-supplies",
    name: "Research Supplies",
    desc: "Bacteriostatic water, reconstitution & lab essentials.",
    icon: "ri-syringe-line",
  },
];

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [shopMenuOpen, setShopMenuOpen] = useState(false);
  const [mobileShopOpen, setMobileShopOpen] = useState(false);
  const [contactMenuOpen, setContactMenuOpen] = useState(false);
  const [mobileContactOpen, setMobileContactOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const contactCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { count, openCart } = useCart();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const openShopMenu = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setShopMenuOpen(true);
  };
  const scheduleCloseShopMenu = () => {
    closeTimer.current = setTimeout(() => setShopMenuOpen(false), 150);
  };

  const openContactMenu = () => {
    if (contactCloseTimer.current) clearTimeout(contactCloseTimer.current);
    setContactMenuOpen(true);
  };
  const scheduleCloseContactMenu = () => {
    contactCloseTimer.current = setTimeout(() => setContactMenuOpen(false), 150);
  };

  return (
    <header
      className={`fixed top-10 left-0 right-0 z-50 transition-all duration-500 ease-precision ${
        scrolled
          ? "bg-background-800/85 backdrop-blur-xl border-b border-background-200/60"
          : "bg-transparent border-b border-transparent"
      }`}
    >
      <div className="w-full px-6 md:px-10 h-[72px] flex items-center justify-between">
        <Link className="group flex items-center gap-3 cursor-pointer" href="/">
          <span className="relative w-9 h-9 flex items-center justify-center shrink-0">
            <span className="absolute inset-0 rounded-lg border border-primary-500/50 rotate-45 group-hover:border-primary-500 group-hover:shadow-[0_0_18px_-2px_rgba(94,232,213,0.7)] transition-all duration-500 ease-precision"></span>
            <span className="absolute inset-[7px] rounded-md bg-primary-500/10 rotate-45 group-hover:bg-primary-500/20 transition-colors duration-500 ease-precision"></span>
            <span className="relative w-2 h-2 rounded-full bg-primary-500 shadow-[0_0_12px_3px_rgba(94,232,213,0.65)]"></span>
          </span>
          <span className="flex flex-col leading-none">
            <span className="font-display text-[20px] md:text-[22px] tracking-[0.22em] text-foreground-100 group-hover:text-primary-500 transition-colors duration-300">
              VERTALIS
            </span>
            <span className="font-mono text-[8px] md:text-[9px] tracking-[0.42em] text-foreground-500 uppercase mt-1">
              Laboratories
            </span>
          </span>
        </Link>
        <nav className="hidden lg:flex items-center gap-10">
          {NAV_LINKS.map((link) =>
            link.href === "/shop" ? (
              <div
                key={link.href}
                className="relative"
                onMouseEnter={openShopMenu}
                onMouseLeave={scheduleCloseShopMenu}
              >
                <Link
                  href={link.href}
                  className="flex items-center gap-1.5 text-[13px] tracking-wide text-foreground-300 hover:text-foreground-100 transition-colors relative group"
                  aria-expanded={shopMenuOpen}
                >
                  {link.label}
                  <i
                    className={`ri-arrow-down-s-line text-[14px] transition-transform duration-300 ease-precision ${
                      shopMenuOpen ? "rotate-180 text-primary-500" : ""
                    }`}
                  ></i>
                  <span className="absolute -bottom-1.5 left-0 h-px w-0 bg-primary-500 transition-all duration-500 ease-precision group-hover:w-full"></span>
                </Link>

                {/* Mega menu */}
                <div
                  className={`absolute left-1/2 -translate-x-1/2 top-[calc(100%+18px)] w-[640px] max-w-[90vw] rounded-lg bg-background-800/95 backdrop-blur-xl border border-background-200/60 shadow-[0_24px_60px_-16px_rgba(0,0,0,0.6)] transition-all duration-300 ease-precision ${
                    shopMenuOpen
                      ? "opacity-100 translate-y-0 pointer-events-auto"
                      : "opacity-0 -translate-y-2 pointer-events-none"
                  }`}
                >
                  <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-background-200/50">
                    <span className="font-mono text-[10px] tracking-[0.24em] text-primary-500 uppercase">
                      Shop by Category
                    </span>
                    <Link
                      href="/shop"
                      className="inline-flex items-center gap-1.5 text-[12px] font-medium text-foreground-200 hover:text-primary-500 transition-colors"
                    >
                      All Products
                      <i className="ri-arrow-right-line text-[13px]"></i>
                    </Link>
                  </div>
                  <div className="grid grid-cols-2 gap-1 p-3">
                    {SHOP_CATEGORIES.map((cat) => (
                      <Link
                        key={cat.slug}
                        href={`/shop/${cat.slug}`}
                        className="group/cat flex items-start gap-3 rounded-md p-3 hover:bg-background-100/70 transition-colors duration-300 ease-precision"
                      >
                        <span className="w-8 h-8 flex items-center justify-center rounded-md bg-primary-500/10 text-primary-500 shrink-0 group-hover/cat:bg-primary-500 group-hover/cat:text-background-900 transition-all duration-300 ease-precision">
                          <i className={`${cat.icon} text-[15px]`}></i>
                        </span>
                        <span className="flex flex-col">
                          <span className="text-[13px] font-medium text-foreground-100 group-hover/cat:text-primary-500 transition-colors">
                            {cat.name}
                          </span>
                          <span className="text-[11px] text-foreground-500 leading-snug mt-0.5">
                            {cat.desc}
                          </span>
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            ) : link.href === "/contact" ? (
              <div
                key={link.href}
                className="relative"
                onMouseEnter={openContactMenu}
                onMouseLeave={scheduleCloseContactMenu}
              >
                <Link
                  href={link.href}
                  className="flex items-center gap-1.5 text-[13px] tracking-wide text-foreground-300 hover:text-foreground-100 transition-colors relative group"
                  aria-expanded={contactMenuOpen}
                >
                  {link.label}
                  <i
                    className={`ri-arrow-down-s-line text-[14px] transition-transform duration-300 ease-precision ${
                      contactMenuOpen ? "rotate-180 text-primary-500" : ""
                    }`}
                  ></i>
                  <span className="absolute -bottom-1.5 left-0 h-px w-0 bg-primary-500 transition-all duration-500 ease-precision group-hover:w-full"></span>
                </Link>

                {/* Dropdown */}
                <div
                  className={`absolute right-0 top-[calc(100%+18px)] w-[300px] rounded-lg bg-background-800/95 backdrop-blur-xl border border-background-200/60 shadow-[0_24px_60px_-16px_rgba(0,0,0,0.6)] transition-all duration-300 ease-precision overflow-hidden ${
                    contactMenuOpen
                      ? "opacity-100 translate-y-0 pointer-events-auto"
                      : "opacity-0 -translate-y-2 pointer-events-none"
                  }`}
                >
                  {CONTACT_DROPDOWN.map((item) => (
                    <Link
                      key={item.slug}
                      href={item.href}
                      className="group/item flex items-start gap-3 px-4 py-3.5 hover:bg-background-100/70 transition-colors duration-300 ease-precision border-b border-background-200/40 last:border-none"
                    >
                      <span className="w-8 h-8 flex items-center justify-center rounded-md bg-primary-500/10 text-primary-500 shrink-0 group-hover/item:bg-primary-500 group-hover/item:text-background-900 transition-all duration-300 ease-precision">
                        <i className={`${item.icon} text-[14px]`}></i>
                      </span>
                      <span className="flex flex-col">
                        <span className="text-[13px] font-medium text-foreground-100 group-hover/item:text-primary-500 transition-colors">
                          {item.name}
                        </span>
                        <span className="text-[11px] text-foreground-500 leading-snug mt-0.5">
                          {item.desc}
                        </span>
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            ) : (
              <Link
                key={link.href}
                href={link.href}
                className="text-[13px] tracking-wide text-foreground-300 hover:text-foreground-100 transition-colors relative group"
              >
                {link.label}
                <span className="absolute -bottom-1.5 left-0 h-px w-0 bg-primary-500 transition-all duration-500 ease-precision group-hover:w-full"></span>
              </Link>
            )
          )}
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
            {NAV_LINKS.map((link) =>
              link.href === "/shop" ? (
                <div key={link.href} className="border-b border-background-200/40">
                  <div className="flex items-center justify-between py-3">
                    <Link
                      href={link.href}
                      onClick={() => setMenuOpen(false)}
                      className="text-[13px] tracking-wide text-foreground-300 hover:text-foreground-100 transition-colors"
                    >
                      {link.label}
                    </Link>
                    <button
                      aria-label="Toggle categories"
                      onClick={() => setMobileShopOpen((v) => !v)}
                      className="w-8 h-8 flex items-center justify-center text-foreground-400 cursor-pointer"
                    >
                      <i
                        className={`ri-arrow-down-s-line text-[16px] transition-transform duration-300 ease-precision ${
                          mobileShopOpen ? "rotate-180 text-primary-500" : ""
                        }`}
                      ></i>
                    </button>
                  </div>
                  {mobileShopOpen && (
                    <div className="pb-3 grid grid-cols-1 gap-0.5">
                      {SHOP_CATEGORIES.map((cat) => (
                        <Link
                          key={cat.slug}
                          href={`/shop/${cat.slug}`}
                          onClick={() => setMenuOpen(false)}
                          className="flex items-center gap-2.5 py-2 pl-2 text-[12px] text-foreground-400 hover:text-primary-500 transition-colors"
                        >
                          <i className={`${cat.icon} text-[13px]`}></i>
                          {cat.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ) : link.href === "/contact" ? (
                <div key={link.href} className="border-b border-background-200/40">
                  <div className="flex items-center justify-between py-3">
                    <Link
                      href={link.href}
                      onClick={() => setMenuOpen(false)}
                      className="text-[13px] tracking-wide text-foreground-300 hover:text-foreground-100 transition-colors"
                    >
                      {link.label}
                    </Link>
                    <button
                      aria-label="Toggle contact links"
                      onClick={() => setMobileContactOpen((v) => !v)}
                      className="w-8 h-8 flex items-center justify-center text-foreground-400 cursor-pointer"
                    >
                      <i
                        className={`ri-arrow-down-s-line text-[16px] transition-transform duration-300 ease-precision ${
                          mobileContactOpen ? "rotate-180 text-primary-500" : ""
                        }`}
                      ></i>
                    </button>
                  </div>
                  {mobileContactOpen && (
                    <div className="pb-3 grid grid-cols-1 gap-0.5">
                      {CONTACT_DROPDOWN.map((item) => (
                        <Link
                          key={item.slug}
                          href={item.href}
                          onClick={() => setMenuOpen(false)}
                          className="flex items-center gap-2.5 py-2 pl-2 text-[12px] text-foreground-400 hover:text-primary-500 transition-colors"
                        >
                          <i className={`${item.icon} text-[13px]`}></i>
                          {item.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="py-3 text-[13px] tracking-wide text-foreground-300 hover:text-foreground-100 transition-colors border-b border-background-200/40 last:border-none"
                >
                  {link.label}
                </Link>
              )
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
