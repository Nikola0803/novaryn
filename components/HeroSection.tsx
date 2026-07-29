"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";

// Client-only: react-three-fiber's Canvas touches WebGL/window at mount,
// so it's loaded with ssr:false rather than imported directly. The empty
// fallback keeps the panel's footprint stable (no layout shift) while the
// bundle loads in.
const HeroVial3D = dynamic(() => import("./HeroVial3D"), {
  ssr: false,
  loading: () => <div className="w-full h-full" />,
});

const TEAL   = "rgb(var(--primary-500))";
const TEAL_D = "rgb(var(--hero-dim))";
const TEAL_L = "rgb(var(--hero-emphasis))";
const BG     = "rgb(var(--bg-900))";
const FG_DIM = "rgb(var(--fg-100) / 0.48)";

export default function HeroSection() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLight, setIsLight] = useState(false);

  // The 3D vial render is tuned for the dark theme's glow; on the white
  // theme we swap it for the pre-rendered white-mode intro video instead.
  // Tracks [data-theme] on <html> (same mechanism ThemeToggle writes to)
  // so it stays in sync if the user flips themes without a reload.
  useEffect(() => {
    const read = () => setIsLight(document.documentElement.getAttribute("data-theme") === "light");
    read();
    const observer = new MutationObserver(read);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let animId: number;
    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; };
    resize();
    window.addEventListener("resize", resize);

    const particles = Array.from({ length: 55 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.2 + 0.2,
      vx: (Math.random() - 0.5) * 0.16,
      vy: (Math.random() - 0.5) * 0.16,
      alpha: Math.random() * 0.09 + 0.02,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const p of particles) {
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.globalAlpha = p.alpha; ctx.fillStyle = TEAL; ctx.fill();
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;
      }
      ctx.globalAlpha = 1;
      animId = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(animId); window.removeEventListener("resize", resize); };
  }, []);

  return (
    <section
      className="relative w-full overflow-hidden"
      style={{ height: "calc(100vh - 72px)", minHeight: 560, maxHeight: 880, background: BG }}
    >
      {/* Radial ambient */}
      <div className="absolute inset-0 z-0" style={{
        background: `radial-gradient(ellipse 58% 75% at 70% 50%, rgb(var(--primary-500) / 0.06) 0%, transparent 65%), ${BG}`,
      }} />

      {/* Grid */}
      <div className="absolute inset-0 z-[1] grid-overlay opacity-[0.07] pointer-events-none" />

      {/* Left fade so text stays readable */}
      <div className="absolute inset-0 z-[2] pointer-events-none" style={{
        background: "linear-gradient(to right, rgb(var(--bg-900) / 1) 0%, rgb(var(--bg-900) / 0.88) 30%, rgb(var(--bg-900) / 0.45) 52%, rgb(var(--bg-900) / 0) 68%)",
      }} />

      {/* Particles */}
      <canvas ref={canvasRef} className="absolute inset-0 z-[3] w-full h-full pointer-events-none" />

      {/* ── Text + visual panel · both anchored to the same 1440px grid so left/right gutters match exactly ── */}
      <div className="relative z-[8] h-full w-full max-w-[1440px] mx-auto px-6 md:px-10 flex items-center justify-between gap-10 lg:gap-16">
        <div className="max-w-[580px]">

          {/* Eyebrow */}
          <div className="flex items-center gap-3 mb-7" style={{ animation: "nvFadeUp 0.8s ease forwards 0.25s", opacity: 0 }}>
            <span style={{ width: 28, height: 1, background: TEAL, display: "inline-block" }}/>
            <p style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, letterSpacing: "0.3em", textTransform: "uppercase", color: TEAL_D }}>
              USA Research Grade Peptides
            </p>
          </div>

          {/* Main headline · Vertalis's own copy */}
          <div style={{ marginBottom: 14 }}>
            <h1 style={{
              fontSize: "clamp(44px, 5.8vw, 82px)", lineHeight: 0.9,
              fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700,
              letterSpacing: "-0.03em", color: "rgb(var(--fg-100))",
              animation: "nvFadeUp 0.9s ease forwards 0.42s", opacity: 0,
            }}>
              Research‑Grade
            </h1>
            <h1 style={{
              fontSize: "clamp(44px, 5.8vw, 82px)", lineHeight: 0.9,
              fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700,
              letterSpacing: "-0.03em",
              background: `linear-gradient(135deg, ${TEAL_D} 0%, ${TEAL_L} 40%, ${TEAL} 80%)`,
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
              animation: "nvFadeUp 0.9s ease forwards 0.56s", opacity: 0,
            }}>
              Peptides.
            </h1>
            <h1 style={{
              fontSize: "clamp(44px, 5.8vw, 82px)", lineHeight: 0.9,
              fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700,
              letterSpacing: "-0.03em",
              color: "transparent", WebkitTextStroke: `1.5px ${TEAL_D}`,
              animation: "nvFadeUp 0.9s ease forwards 0.7s", opacity: 0,
            }}>
              Verified.
            </h1>
          </div>

          {/* Sub-label */}
          <p style={{
            fontFamily: "'JetBrains Mono',monospace", fontSize: "clamp(9px,1vw,12px)",
            color: TEAL_D, letterSpacing: "0.22em", textTransform: "uppercase",
            marginBottom: 16, animation: "nvFadeUp 0.9s ease forwards 0.84s", opacity: 0,
          }}>
            Precision Synthesis · Independent COA · Lyophilized
          </p>

          {/* Divider */}
          <div style={{
            width: 280, height: 1,
            background: `linear-gradient(to right, ${TEAL}, rgb(var(--primary-500) / 0.06))`,
            marginBottom: 16, animation: "nvFadeUp 0.8s ease forwards 0.94s", opacity: 0,
          }} />

          {/* Body */}
          <p style={{
            fontSize: "clamp(12px,1.2vw,14px)", lineHeight: 1.75, color: FG_DIM,
            maxWidth: 420, marginBottom: 4,
            animation: "nvFadeUp 0.9s ease forwards 1.04s", opacity: 0,
          }}>
            Premium research-grade peptides lyophilized and verified in the USA. Engineered for consistency, stability, and analytical reliability.
          </p>
          <p style={{
            fontSize: 10, fontStyle: "italic", color: "rgb(var(--fg-100) / 0.2)",
            marginBottom: 20, animation: "nvFadeUp 0.9s ease forwards 1.12s", opacity: 0,
          }}>
            *For Research Use Only. Not intended for human consumption.*
          </p>

          {/* Badges */}
          <div className="flex flex-wrap gap-2" style={{ marginBottom: 24, animation: "nvFadeUp 0.9s ease forwards 1.18s", opacity: 0 }}>
            {["≥99% PURITY", "3RD PARTY TESTED", "LYOPHILIZED · NO COLD-CHAIN"].map((b) => (
              <div key={b} className="flex items-center gap-2" style={{
                padding: "5px 12px", border: `1px solid rgb(var(--primary-500) / 0.25)`,
                background: "rgb(var(--primary-500) / 0.04)",
                fontFamily: "'JetBrains Mono',monospace", fontSize: 9.5,
                letterSpacing: "0.13em", color: TEAL,
              }}>
                <span style={{ width: 4, height: 4, borderRadius: "50%", background: TEAL, display: "inline-block", animation: "nvPulse 2s ease-in-out infinite" }}/>
                {b}
              </div>
            ))}
          </div>

          {/* CTAs */}
          <div className="flex flex-wrap items-center gap-5" style={{ marginBottom: 30, animation: "nvFadeUp 0.9s ease forwards 1.3s", opacity: 0 }}>
            <Link href="/shop" className="inline-flex items-center gap-3 transition-all duration-200 whitespace-nowrap"
              style={{ background: TEAL, color: BG, padding: "13px 30px", fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 13, letterSpacing: "0.15em", textTransform: "uppercase" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = TEAL_L; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = TEAL; }}>
              Shop Catalog <i className="ri-arrow-right-line"/>
            </Link>
            <Link href="/coa" className="transition-all duration-200 whitespace-nowrap"
              style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, letterSpacing: "0.14em", color: TEAL_D, borderBottom: `1.5px solid rgb(var(--primary-500) / 0.28)`, paddingBottom: 2 }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = TEAL; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = TEAL_D; }}>
              Verify a COA →
            </Link>
          </div>

        </div>

        {/* Animated 3D visual · right side, sized against the same container so its right gutter matches the text's left gutter */}
        <div className="hidden lg:block relative shrink-0" style={{ width: "48%", maxWidth: 760, height: "88%" }}>
          {/* Ambient glow behind the visual */}
          <div className="absolute inset-0 pointer-events-none" style={{
            background: "radial-gradient(ellipse 65% 65% at 50% 48%, rgb(var(--primary-500) / 0.16) 0%, transparent 72%)",
          }} />

          {/* Procedural peptide-chain render on dark theme; pre-rendered
              intro video on the white theme, where the 3D glow reads muddy
              against a light background. */}
          <div className="absolute inset-0" style={{ animation: "nvFadeUp 1.1s ease forwards 0.5s", opacity: 0 }}>
            {isLight ? (
              <video
                className="w-full h-full object-contain"
                src="/videos/hero-intro-white-01.mp4"
                autoPlay
                muted
                loop
                playsInline
                aria-hidden="true"
              />
            ) : (
              <HeroVial3D />
            )}
          </div>

          {/* Compact trust chip, floated over the bottom of the visual */}
          <div
            className="absolute left-1/2 bottom-2 -translate-x-1/2 w-[86%] max-w-[420px]"
            style={{ animation: "nvFadeUp 0.9s ease forwards 1.3s", opacity: 0 }}
          >
            <Link
              href="/coa"
              className="flex items-center justify-between gap-4 rounded-xl border border-background-200/60 bg-background-900/70 backdrop-blur-sm px-6 py-4 hover:bg-primary-500/[0.05] transition-colors duration-300 cursor-pointer"
              style={{ boxShadow: "0 30px 80px -24px rgba(0,0,0,0.55)" }}
            >
              <span className="flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-primary-500 shrink-0" style={{ animation: "nvPulse 2s ease-in-out infinite" }} />
                <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 13, color: "rgb(var(--fg-100) / 0.75)" }}>
                  99.15% Purity · Batch VTX‑24‑1142‑C
                </span>
              </span>
              <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, letterSpacing: "0.1em", color: TEAL, whiteSpace: "nowrap" }}>
                View COA →
              </span>
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom border */}
      <div className="absolute bottom-0 left-0 right-0 z-[9]" style={{ height: 1, background: `linear-gradient(to right, ${TEAL}, rgb(var(--primary-500) / 0.05))`, opacity: 0.25 }}/>

      {/* Edge vignette */}
      <div className="absolute inset-0 z-[6] pointer-events-none" style={{ background: "radial-gradient(ellipse 100% 100% at 50% 50%, transparent 46%, rgba(5,5,5,0.55) 100%)" }}/>

      <style>{`
        @keyframes nvFadeUp {
          from { opacity:0; transform:translateY(14px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes nvPulse {
          0%,100% { opacity:0.9; transform:scale(1); }
          50%     { opacity:0.5; transform:scale(0.85); }
        }
        @keyframes nvFloat {
          0%,100% { transform:translateY(0); }
          50%     { transform:translateY(-8px); }
        }
        @keyframes nvFloat2 {
          0%,100% { transform:translateY(0); }
          50%     { transform:translateY(-5px); }
        }
      `}</style>
    </section>
  );
}
