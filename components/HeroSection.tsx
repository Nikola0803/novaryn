"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";

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
            Precision Synthesis · Independent COA · Lyophilized
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
            Premium research-grade peptides lyophilized and verified in the USA. Engineered for consistency, stability, and analytical reliability.
          </p>
          <p style={{
            fontSize: 10, fontStyle: "italic", color: "rgba(233,237,242,0.2)",
            marginBottom: 20, animation: "nvFadeUp 0.9s ease forwards 1.12s", opacity: 0,
          }}>
            *For Research Use Only. Not intended for human consumption.*
          </p>

          {/* Badges */}
          <div className="flex flex-wrap gap-2" style={{ marginBottom: 24, animation: "nvFadeUp 0.9s ease forwards 1.18s", opacity: 0 }}>
            {["≥99% PURITY", "3RD PARTY TESTED", "LYOPHILIZED · NO COLD-CHAIN"].map((b) => (
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

        </div>

        {/* Live MS trace panel · right side, sized against the same container so its right gutter matches the text's left gutter */}
        <div className="hidden lg:block relative shrink-0" style={{ width: "48%", maxWidth: 760 }}>
          {/* Ambient glow behind the panel */}
          <div className="absolute inset-0 pointer-events-none" style={{
            background: "radial-gradient(ellipse 70% 70% at 50% 50%, rgba(94,232,213,0.13) 0%, transparent 70%)",
          }} />

          <div
            className="relative rounded-2xl border border-background-200/60 bg-background-900/70 backdrop-blur-sm overflow-hidden"
            style={{ boxShadow: "0 50px 120px -30px rgba(0,0,0,0.65)" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-9 py-6 border-b border-background-200/50" style={{ background: "rgba(94,232,213,0.04)" }}>
              <div className="flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-primary-500" style={{ animation: "nvPulse 2s ease-in-out infinite" }} />
                <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 17, letterSpacing: "0.15em", color: TEAL_D, textTransform: "uppercase" }}>
                  MS Confirmation · BPC-157
                </span>
              </div>
              <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 16, color: "rgba(233,237,242,0.35)" }}>
                BATCH VTX-24-1142-C
              </span>
            </div>

            {/* Mass spectrum */}
            <div className="px-9 pt-10 pb-5">
              <svg viewBox="0 0 400 150" className="w-full h-auto overflow-visible" preserveAspectRatio="none">
                {[0, 1, 2, 3].map((i) => (
                  <line key={`h${i}`} x1="0" x2="400" y1={i * 38} y2={i * 38} stroke="rgba(94,232,213,0.08)" strokeWidth="1" />
                ))}
                {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
                  <line key={`v${i}`} x1={i * 50} x2={i * 50} y1="0" y2="146" stroke="rgba(94,232,213,0.06)" strokeWidth="1" />
                ))}
                <line x1="0" x2="400" y1="146" y2="146" stroke="rgba(94,232,213,0.2)" strokeWidth="1" />

                {[
                  { x: 40, h: 13 }, { x: 68, h: 8 }, { x: 100, h: 18 }, { x: 140, h: 10 },
                  { x: 190, h: 48 }, { x: 210, h: 28 },
                  { x: 280, h: 136 },
                  { x: 300, h: 20 }, { x: 335, h: 25 }, { x: 365, h: 11 },
                ].map((peak, i) => (
                  <line
                    key={i}
                    x1={peak.x} x2={peak.x} y1={146} y2={146 - peak.h}
                    stroke={peak.x === 280 ? TEAL_L : TEAL}
                    strokeWidth={peak.x === 280 ? 3 : 1.8}
                    strokeLinecap="round"
                    opacity={peak.x === 280 ? 1 : 0.55}
                  />
                ))}

                <text x="280" y="0" textAnchor="middle" fill={TEAL_L} style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 17 }}>
                  1419.6 [M+H]⁺
                </text>
                <circle cx="280" cy="7" r="5" fill={TEAL_L}>
                  <animate attributeName="opacity" values="1;0.35;1" dur="2.4s" repeatCount="indefinite" />
                </circle>

                <rect x="0" y="0" width="2" height="146" fill={TEAL} opacity="0.4">
                  <animate attributeName="x" values="0;398;0" keyTimes="0;0.5;1" dur="7s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.45;0.1;0.45" dur="7s" repeatCount="indefinite" />
                </rect>
              </svg>
              <p className="mt-4" style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 15, color: "rgba(233,237,242,0.4)" }}>
                CAS 137525-51-0 · C₆₂H₉₈N₁₆O₂₂
              </p>
            </div>

            {/* Readouts */}
            <div className="grid grid-cols-3 divide-x divide-background-200/40 border-t border-background-200/50">
              {[
                { label: "Purity", value: "99.15%" },
                { label: "MW", value: "1,419.5 Da" },
                { label: "m/z [M+H]⁺", value: "1419.6" },
              ].map((s) => (
                <div key={s.label} className="px-6 py-6 text-center">
                  <p style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 13, letterSpacing: "0.15em", color: "rgba(233,237,242,0.35)", textTransform: "uppercase", marginBottom: 8 }}>
                    {s.label}
                  </p>
                  <p style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 24, color: TEAL_L }}>
                    {s.value}
                  </p>
                </div>
              ))}
            </div>

            {/* Footer */}
            <Link
              href="/coa"
              className="flex items-center justify-between px-9 py-6 border-t border-background-200/50 hover:bg-primary-500/[0.04] transition-colors duration-300 cursor-pointer"
            >
              <span className="flex items-center gap-2" style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 15, color: "rgba(233,237,242,0.45)" }}>
                <i className="ri-shield-check-line" style={{ color: TEAL }}></i>
                Verified · Janoshik Analytical
              </span>
              <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 15, color: TEAL }}>
                View COA →
              </span>
            </Link>
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
