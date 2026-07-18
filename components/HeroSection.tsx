"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";

const HeroVial3D = dynamic(() => import("./HeroVial3D"), { ssr: false });

const TEAL   = "#5EE8D5";
const TEAL_D = "#3bb8a8";
const TEAL_L = "#a8f5ed";
const BG     = "#08090B";
const FG_DIM = "rgba(233,237,242,0.48)";

export default function HeroSection() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

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
        background: `radial-gradient(ellipse 58% 75% at 70% 50%, #0d1a19 0%, transparent 65%), ${BG}`,
      }} />

      {/* Grid */}
      <div className="absolute inset-0 z-[1] grid-overlay opacity-[0.07] pointer-events-none" />

      {/* Left fade so text stays readable */}
      <div className="absolute inset-0 z-[2] pointer-events-none" style={{
        background: "linear-gradient(to right, rgba(8,9,11,1) 0%, rgba(8,9,11,0.88) 30%, rgba(8,9,11,0.45) 52%, rgba(8,9,11,0) 68%)",
      }} />

      {/* Particles */}
      <canvas ref={canvasRef} className="absolute inset-0 z-[3] w-full h-full pointer-events-none" />

      {/* Scanline */}
      <div className="absolute top-0 bottom-0 z-[4] pointer-events-none" style={{
        width: 1,
        background: `linear-gradient(to bottom, transparent, ${TEAL_D} 20%, ${TEAL_L} 50%, ${TEAL_D} 80%, transparent)`,
        animation: "nvScanline 10s ease-in-out infinite",
        opacity: 0.5,
      }} />

      {/* Corner marks */}
      {([
        { top: 20, left: 20, bt: true, bl: true },
        { top: 20, right: 20, bt: true, br: true },
        { bottom: 20, left: 20, bb: true, bl: true },
        { bottom: 20, right: 20, bb: true, br: true },
      ] as const).map((c, i) => (
        <div key={i} className="absolute z-[10] pointer-events-none" style={{
          width: 20, height: 20,
          top: (c as any).top, bottom: (c as any).bottom,
          left: (c as any).left, right: (c as any).right,
          borderTop:    (c as any).bt ? `1.5px solid ${TEAL}` : undefined,
          borderLeft:   (c as any).bl ? `1.5px solid ${TEAL}` : undefined,
          borderBottom: (c as any).bb ? `1.5px solid ${TEAL}` : undefined,
          borderRight:  (c as any).br ? `1.5px solid ${TEAL}` : undefined,
          opacity: 0.45,
        }} />
      ))}

      {/* 3D rotating vial — right half (kept clear of the fixed banner + nav, which together occupy the top 112px) */}
      <div className="absolute right-0 top-[112px] bottom-0 z-[5] hidden lg:block" style={{ width: "50%" }}>
        {/* Ambient glow behind the vial */}
        <div className="absolute inset-0 pointer-events-none" style={{
          background: "radial-gradient(ellipse 42% 50% at 55% 48%, rgba(94,232,213,0.12) 0%, transparent 70%)",
        }} />

        <div className="absolute inset-0">
          <HeroVial3D />
        </div>

        {/* Floating verification pill */}
        <div className="absolute top-8 left-10 flex items-center gap-2 px-3 py-1.5 rounded-full bg-background-900/80 backdrop-blur border border-primary-500/30 pointer-events-none" style={{ animation: "nvFloat 6s ease-in-out infinite" }}>
          <span className="w-1.5 h-1.5 rounded-full bg-primary-500 shadow-[0_0_8px_2px_rgba(94,232,213,0.6)]" />
          <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, letterSpacing: "0.12em", color: "#E9EDF2" }}>
            3RD PARTY VERIFIED
          </span>
        </div>

        {/* Floating COA readout card */}
        <div className="absolute bottom-16 left-10 w-[190px] rounded-md bg-background-900/85 backdrop-blur border border-background-200/60 pointer-events-none overflow-hidden" style={{ animation: "nvFloat2 8s ease-in-out infinite 2s" }}>
          <div className="flex items-center gap-1.5 px-3 py-2 border-b border-background-200/50" style={{ background: "rgba(94,232,213,0.06)" }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#FF5C5C", opacity: 0.6 }} />
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#FFBC00", opacity: 0.6 }} />
            <span className="w-1.5 h-1.5 rounded-full bg-primary-500" style={{ opacity: 0.6 }} />
            <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: TEAL_D, marginLeft: 4 }}>COA DATA</span>
          </div>
          <div className="px-3 py-2.5" style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9.5 }}>
            <p className="text-foreground-600 mb-1">Purity: <span style={{ color: TEAL_L }}>99.42%</span></p>
            <p className="text-foreground-600 mb-1">MW: <span className="text-foreground-100">4,113.6 Da</span></p>
            <p className="text-foreground-600">Batch: <span className="text-foreground-100">VTX-24-1108-A</span></p>
          </div>
        </div>
      </div>

      {/* ── Text — constrained to same 1440px grid as rest of page ── */}
      <div className="relative z-[8] h-full w-full max-w-[1440px] mx-auto px-6 md:px-10 flex flex-col justify-center">
        <div className="max-w-[580px]">

          {/* Eyebrow */}
          <div className="flex items-center gap-3 mb-7" style={{ animation: "nvFadeUp 0.8s ease forwards 0.25s", opacity: 0 }}>
            <span style={{ width: 28, height: 1, background: TEAL, display: "inline-block" }}/>
            <p style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, letterSpacing: "0.3em", textTransform: "uppercase", color: TEAL_D }}>
              USA Research Grade Peptides
            </p>
          </div>

          {/* Main headline — Vertalis's own copy */}
          <div style={{ marginBottom: 14 }}>
            <h1 style={{
              fontSize: "clamp(44px, 5.8vw, 82px)", lineHeight: 0.9,
              fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700,
              letterSpacing: "-0.03em", color: "#E9EDF2",
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
            Precision Synthesis · Independent COA · Cold-Chain
          </p>

          {/* Divider */}
          <div style={{
            width: 280, height: 1,
            background: `linear-gradient(to right, ${TEAL}, rgba(94,232,213,0.06))`,
            marginBottom: 16, animation: "nvFadeUp 0.8s ease forwards 0.94s", opacity: 0,
          }} />

          {/* Body */}
          <p style={{
            fontSize: "clamp(12px,1.2vw,14px)", lineHeight: 1.75, color: FG_DIM,
            maxWidth: 420, marginBottom: 4,
            animation: "nvFadeUp 0.9s ease forwards 1.04s", opacity: 0,
          }}>
            Every batch HPLC-verified and independently tested before it ships. Every COA published publicly the moment it clears — searchable by batch code.
          </p>
          <p style={{
            fontSize: 10, fontStyle: "italic", color: "rgba(233,237,242,0.2)",
            marginBottom: 20, animation: "nvFadeUp 0.9s ease forwards 1.12s", opacity: 0,
          }}>
            *For Research Use Only. Not intended for human consumption.*
          </p>

          {/* Badges */}
          <div className="flex flex-wrap gap-2" style={{ marginBottom: 24, animation: "nvFadeUp 0.9s ease forwards 1.18s", opacity: 0 }}>
            {["≥99% PURITY", "3RD PARTY TESTED", "COLD-CHAIN 24H"].map((b) => (
              <div key={b} className="flex items-center gap-2" style={{
                padding: "5px 12px", border: `1px solid rgba(94,232,213,0.25)`,
                background: "rgba(94,232,213,0.04)",
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
              style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, letterSpacing: "0.14em", color: TEAL_D, borderBottom: `1.5px solid rgba(94,232,213,0.28)`, paddingBottom: 2 }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = TEAL; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = TEAL_D; }}>
              Verify a COA →
            </Link>
          </div>

          {/* Stats */}
          <div className="flex items-center" style={{ gap: 22, animation: "nvFadeUp 0.9s ease forwards 1.44s", opacity: 0 }}>
            {[
              { val: "≥99%",  label: "Purity" },
              { val: "24h",   label: "Cold-Chain" },
              { val: "2,847", label: "COAs Live" },
              { val: "100%",  label: "Verified" },
            ].map((s, i, arr) => (
              <div key={s.label} className="flex items-center" style={{ gap: 22 }}>
                <div>
                  <p style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 16, letterSpacing: "0.03em", background: `linear-gradient(135deg, ${TEAL_L}, ${TEAL})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>{s.val}</p>
                  <p style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 8.5, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(233,237,242,0.28)", marginTop: 2 }}>{s.label}</p>
                </div>
                {i < arr.length - 1 && <div style={{ width: 1, height: 28, background: "rgba(94,232,213,0.14)" }}/>}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom border */}
      <div className="absolute bottom-0 left-0 right-0 z-[9]" style={{ height: 1, background: `linear-gradient(to right, ${TEAL}, rgba(94,232,213,0.05))`, opacity: 0.25 }}/>

      {/* Edge vignette */}
      <div className="absolute inset-0 z-[6] pointer-events-none" style={{ background: "radial-gradient(ellipse 100% 100% at 50% 50%, transparent 46%, rgba(5,5,5,0.55) 100%)" }}/>

      <style>{`
        @keyframes nvScanline {
          0%   { left:-2%; opacity:0; }
          8%   { opacity:0.5; }
          92%  { opacity:0.35; }
          100% { left:102%; opacity:0; }
        }
        @keyframes nvFadeUp {
          from { opacity:0; transform:translateY(14px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes nvPulse {
          0%,100% { opacity:1; transform:scale(1); }
          50%     { opacity:0.35; transform:scale(0.6); }
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
